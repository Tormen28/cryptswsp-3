import { LimitService } from '@/services/limits/LimitService';
import { RetryService } from '@/services/retry/RetryService';
import { BackupService } from '@/services/backup/BackupService';
import { Token } from '@/types/token';
import { AutoSwapConfig } from '@/types/autoSwap';

describe('Servicios de Integración', () => {
  let limitService: LimitService;
  let retryService: RetryService;
  let backupService: BackupService;
  let testToken: Token;
  let testConfig: AutoSwapConfig;

  beforeAll(() => {
    limitService = LimitService.getInstance();
    retryService = RetryService.getInstance();
    backupService = BackupService.getInstance();

    testToken = {
      address: 'test-address',
      symbol: 'TEST',
      name: 'Test Token',
      decimals: 6
    };

    testConfig = {
      enabled: true,
      fromToken: testToken,
      toToken: {
        address: 'test-address-2',
        symbol: 'TEST2',
        name: 'Test Token 2',
        decimals: 6
      },
      slippage: 0.5,
      dailyLimit: 1000,
      monthlyLimit: 10000,
      minAmount: 10,
      maxAmount: 100,
      priceAlert: 5
    };
  });

  describe('LimitService', () => {
    beforeEach(async () => {
      await limitService.resetLimits();
    });

    it('debería verificar límites correctamente', async () => {
      const result = await limitService.checkLimits(
        100,
        testToken,
        1000,
        10000
      );
      expect(result).toBe(true);
    });

    it('debería rechazar operaciones que exceden el límite diario', async () => {
      await limitService.updateLimits(900, testToken);
      const result = await limitService.checkLimits(
        200,
        testToken,
        1000,
        10000
      );
      expect(result).toBe(false);
    });

    it('debería rechazar operaciones que exceden el límite mensual', async () => {
      await limitService.updateLimits(9000, testToken);
      const result = await limitService.checkLimits(
        2000,
        testToken,
        1000,
        10000
      );
      expect(result).toBe(false);
    });
  });

  describe('RetryService', () => {
    it('debería ejecutar operación exitosa sin reintentos', async () => {
      const operation = async () => 'success';
      const result = await retryService.executeWithRetry(
        operation,
        'test-operation'
      );
      expect(result).toBe('success');
    });

    it('debería reintentar operación fallida', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Temporary error');
        }
        return 'success';
      };

      const result = await retryService.executeWithRetry(
        operation,
        'test-operation',
        { maxRetries: 3, initialDelay: 100 }
      );
      expect(result).toBe('success');
      expect(attempts).toBe(2);
    });

    it('debería fallar después de máximo de reintentos', async () => {
      const operation = async () => {
        throw new Error('Permanent error');
      };

      await expect(
        retryService.executeWithRetry(operation, 'test-operation', {
          maxRetries: 2,
          initialDelay: 100
        })
      ).rejects.toThrow('Permanent error');
    });
  });

  describe('BackupService', () => {
    beforeEach(async () => {
      const backups = await backupService.getBackups();
      for (const backup of backups) {
        await backupService.deleteBackup(backup.timestamp);
      }
    });

    it('debería crear y restaurar backup', async () => {
      await backupService.createBackup(testConfig);
      const backups = await backupService.getBackups();
      expect(backups.length).toBe(1);

      const backup = backups[0];
      expect(backup.config).toEqual(testConfig);

      await backupService.restoreBackup(backup.timestamp);
      const restoredBackups = await backupService.getBackups();
      expect(restoredBackups[0].config).toEqual(testConfig);
    });

    it('debería exportar e importar backup', async () => {
      await backupService.createBackup(testConfig);
      const backups = await backupService.getBackups();
      const backup = backups[0];

      const exportString = await backupService.exportBackup(backup.timestamp);
      const exportData = JSON.parse(exportString);
      expect(exportData.config).toEqual(testConfig);

      await backupService.deleteBackup(backup.timestamp);
      await backupService.importBackup(exportString);

      const importedBackups = await backupService.getBackups();
      expect(importedBackups[0].config).toEqual(testConfig);
    });

    it('debería mantener máximo de backups', async () => {
      for (let i = 0; i < 15; i++) {
        await backupService.createBackup({
          ...testConfig,
          dailyLimit: i
        });
      }

      const backups = await backupService.getBackups();
      expect(backups.length).toBe(10);
    });
  });
}); 