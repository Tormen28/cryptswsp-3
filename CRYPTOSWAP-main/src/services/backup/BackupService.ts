import { SecureStorage } from '../storage/SecureStorage';
import { LoggerService } from '../logging/LoggerService';

export interface BackupConfig {
  id: string;
  timestamp: number;
  data: any;
  version: string;
}

export class BackupService {
  private static instance: BackupService;
  private readonly storage: SecureStorage;
  private readonly logger: LoggerService;
  private readonly maxBackups: number = 5;
  private readonly version: string = '1.0.0';

  private constructor() {
    this.storage = SecureStorage.getInstance();
    this.logger = LoggerService.getInstance();
  }

  static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  async createBackup(data: any): Promise<string> {
    try {
      const backup: BackupConfig = {
        id: this.generateBackupId(),
        timestamp: Date.now(),
        data,
        version: this.version
      };

      const backups = await this.getBackups();
      backups.push(backup);

      // Mantener solo los últimos N backups
      if (backups.length > this.maxBackups) {
        backups.sort((a, b) => b.timestamp - a.timestamp);
        backups.splice(this.maxBackups);
      }

      await this.storage.setItem('backups', backups);
      await this.logger.log(
        'info',
        'Backup creado exitosamente',
        'BackupService',
        { backupId: backup.id }
      );

      return backup.id;
    } catch (error) {
      await this.logger.log(
        'error',
        'Error al crear backup',
        'BackupService',
        { error }
      );
      throw error;
    }
  }

  async restoreBackup(backupId: string): Promise<any> {
    try {
      const backups = await this.getBackups();
      const backup = backups.find(b => b.id === backupId);

      if (!backup) {
        throw new Error(`Backup no encontrado: ${backupId}`);
      }

      // Validar versión
      if (backup.version !== this.version) {
        await this.logger.log(
          'warning',
          'Versión de backup incompatible',
          'BackupService',
          { backupVersion: backup.version, currentVersion: this.version }
        );
      }

      await this.logger.log(
        'info',
        'Backup restaurado exitosamente',
        'BackupService',
        { backupId }
      );

      return backup.data;
    } catch (error) {
      await this.logger.log(
        'error',
        'Error al restaurar backup',
        'BackupService',
        { backupId, error }
      );
      throw error;
    }
  }

  async getBackups(): Promise<BackupConfig[]> {
    try {
      return await this.storage.getItem<BackupConfig[]>('backups') || [];
    } catch (error) {
      await this.logger.log(
        'error',
        'Error al obtener backups',
        'BackupService',
        { error }
      );
      return [];
    }
  }

  async deleteBackup(backupId: string): Promise<void> {
    try {
      const backups = await this.getBackups();
      const filteredBackups = backups.filter(b => b.id !== backupId);
      
      if (filteredBackups.length === backups.length) {
        throw new Error(`Backup no encontrado: ${backupId}`);
      }

      await this.storage.setItem('backups', filteredBackups);
      await this.logger.log(
        'info',
        'Backup eliminado exitosamente',
        'BackupService',
        { backupId }
      );
    } catch (error) {
      await this.logger.log(
        'error',
        'Error al eliminar backup',
        'BackupService',
        { backupId, error }
      );
      throw error;
    }
  }

  private generateBackupId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async exportBackup(backupId: string): Promise<string> {
    try {
      const backups = await this.getBackups();
      const backup = backups.find(b => b.id === backupId);

      if (!backup) {
        throw new Error(`Backup no encontrado: ${backupId}`);
      }

      const exportData = {
        ...backup,
        exportTimestamp: Date.now()
      };

      return JSON.stringify(exportData);
    } catch (error) {
      await this.logger.log(
        'error',
        'Error al exportar backup',
        'BackupService',
        { backupId, error }
      );
      throw error;
    }
  }

  async importBackup(backupData: string): Promise<string> {
    try {
      const backup = JSON.parse(backupData) as BackupConfig;
      
      // Validar estructura
      if (!this.isValidBackup(backup)) {
        throw new Error('Formato de backup inválido');
      }

      return await this.createBackup(backup.data);
    } catch (error) {
      await this.logger.log(
        'error',
        'Error al importar backup',
        'BackupService',
        { error }
      );
      throw error;
    }
  }

  private isValidBackup(backup: any): backup is BackupConfig {
    return (
      typeof backup === 'object' &&
      typeof backup.id === 'string' &&
      typeof backup.timestamp === 'number' &&
      typeof backup.version === 'string' &&
      'data' in backup
    );
  }
} 