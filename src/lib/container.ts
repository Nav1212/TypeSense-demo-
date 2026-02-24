import { FileFetcher } from './fileFetcher';
import { TypeSenseService } from './ingestion';

export class AppContainer {
  constructor(
    public readonly fileFetcher: FileFetcher,
    public readonly tsService: TypeSenseService,
  ) {}

  async bootstrap(): Promise<void> {
    const docs = this.fileFetcher.fetchDocuments();
    console.log(`Fetched ${docs.length} documents from data files`);
    await this.tsService.createCollection();
    await this.tsService.indexDocuments(docs);
  }
}

export function createContainer(): AppContainer {
  return new AppContainer(new FileFetcher(), new TypeSenseService());
}
