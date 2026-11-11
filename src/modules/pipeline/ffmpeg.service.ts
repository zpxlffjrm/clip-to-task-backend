import { Injectable } from '@nestjs/common';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { StorageService } from 'src/modules/R2/r2.service';

export type FfmpegProgressPhase = 'download' | 'probe' | 'convert';

export type FfmpegProgressCallback = (
  phase: FfmpegProgressPhase,
  /** convert 구간에서만 0~1 */
  ratio?: number,
) => void | Promise<void>;

@Injectable()
export class FfmpegService {
  constructor(private readonly storageService: StorageService) {}

  async resetTimestamps(
    fileKey: string,
    onProgress?: FfmpegProgressCallback,
  ): Promise<{ outputPath: string; duration: number }> {
    const workDir = await mkdtemp(join(tmpdir(), 'cliptotask-'));
    const inputPath = join(workDir, 'input');
    const outputPath = join(workDir, 'audio.wav');
    let duration = 0;

    try {
      await onProgress?.('download');
      await this.storageService.downloadToFile(fileKey, inputPath);

      await onProgress?.('probe');
      duration = await this.getDurationSec(inputPath);

      await onProgress?.('convert', 0);
      await this.runFfmpeg(
        [
          '-y',
          '-hide_banner',
          '-loglevel',
          'error',
          '-progress',
          'pipe:1',
          '-nostats',
          '-fflags',
          '+genpts',
          '-i',
          inputPath,
          '-vn',
          '-ac',
          '1',
          '-ar',
          '16000',
          '-c:a',
          'pcm_s16le',
          outputPath,
        ],
        duration,
        async (ratio) => {
          await onProgress?.('convert', ratio);
        },
      );
    } catch (error) {
      await this.cleanup(outputPath);
      throw error;
    }

    await rm(inputPath, { force: true });
    return { outputPath, duration };
  }

  async cleanup(outputPath: string): Promise<void> {
    await rm(dirname(outputPath), { recursive: true, force: true });
  }

  private runFfmpeg(
    args: string[],
    durationSec: number,
    onConvertProgress?: (ratio: number) => void | Promise<void>,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn('ffmpeg', args);
      let stderr = '';
      let stdoutBuf = '';
      let lastEmittedRatio = -1;

      child.stdout.on('data', (chunk: Buffer) => {
        stdoutBuf += chunk.toString();
        const lines = stdoutBuf.split('\n');
        stdoutBuf = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('out_time_ms=')) {
            continue;
          }

          const outTimeMs = Number(trimmed.slice('out_time_ms='.length));
          if (!Number.isFinite(outTimeMs) || durationSec <= 0) {
            continue;
          }

          const ratio = Math.min(1, Math.max(0, outTimeMs / 1_000_000 / durationSec));
          // 약 5% 단위로만 콜백 (소켓 스팸 방지)
          const bucket = Math.floor(ratio * 20) / 20;
          if (bucket <= lastEmittedRatio) {
            continue;
          }
          lastEmittedRatio = bucket;
          void onConvertProgress?.(bucket);
        }
      });

      child.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      child.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'ENOENT') {
          reject(new Error('ffmpeg가 설치되어 있지 않습니다.'));
          return;
        }
        reject(error);
      });

      child.on('close', (code) => {
        if (code === 0) {
          void Promise.resolve(onConvertProgress?.(1))
            .then(() => resolve())
            .catch(reject);
          return;
        }

        reject(
          new Error(
            `타임스탬프 초기화 실패 (ffmpeg exit ${code}): ${stderr.slice(-2000)}`,
          ),
        );
      });
    });
  }

  async getDurationSec(filePath: string): Promise<number> {
    const duration = await this.runFfprobe(filePath);
    return Math.round(duration);
  }

  private runFfprobe(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const child = spawn('ffprobe', [
        '-v',
        'error',
        '-show_entries',
        'format=duration',
        '-of',
        'json=c=1',
        filePath,
      ]);
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
      });
      child.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });
      child.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'ENOENT') {
          reject(
            new Error(
              'ffprobe가 설치되어 있지 않습니다. ffmpeg와 함께 설치하세요.',
            ),
          );
          return;
        }
        reject(error);
      });
      child.on('close', (code) => {
        if (code !== 0) {
          reject(
            new Error(
              `duration 조회 실패 (ffprobe exit ${code}): ${stderr.slice(-2000)}`,
            ),
          );
          return;
        }
        const parsed = JSON.parse(stdout) as { format?: { duration?: string } };
        const duration = Number(parsed.format?.duration);
        if (!Number.isFinite(duration) || duration <= 0) {
          reject(new Error('미디어 duration을 읽을 수 없습니다.'));
          return;
        }
        resolve(duration);
      });
    });
  }
}
