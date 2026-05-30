import { ZapBase } from './zapBase';

export interface UploadResult {
  result: string;
}

export class ConfigUploaderAPI extends ZapBase {
  async uploadAutomation(fileName: string, fileContent: string, overwrite?: boolean): Promise<UploadResult> {
    return this.request<UploadResult>('/JSON/upload/action/uploadAutomation/', {
      fileName,
      fileContent,
      overwrite: overwrite ? 'true' : 'false',
    });
  }

  async uploadConfig(fileName: string, fileContent: string, overwrite?: boolean): Promise<UploadResult> {
    return this.request<UploadResult>('/JSON/upload/action/uploadConfig/', {
      fileName,
      fileContent,
      overwrite: overwrite ? 'true' : 'false',
    });
  }

  async uploadOpenApi(fileName: string, fileContent: string, overwrite?: boolean): Promise<UploadResult> {
    return this.request<UploadResult>('/JSON/upload/action/uploadOpenApi/', {
      fileName,
      fileContent,
      overwrite: overwrite ? 'true' : 'false',
    });
  }

  async uploadGraphQl(fileName: string, fileContent: string, overwrite?: boolean): Promise<UploadResult> {
    return this.request<UploadResult>('/JSON/upload/action/uploadGraphQl/', {
      fileName,
      fileContent,
      overwrite: overwrite ? 'true' : 'false',
    });
  }

  async applyConfig(fileName: string): Promise<UploadResult> {
    return this.request<UploadResult>('/JSON/upload/action/applyConfig/', {
      fileName,
    });
  }
}
