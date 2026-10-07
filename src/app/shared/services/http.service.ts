import { HttpClient } from '@angular/common/http';
import { computed, inject, Service } from '@angular/core';
import { catchError, Observable, of, throwError } from 'rxjs';
import { downloadPayload } from '../../../shared/download';
import { CardFormValue, DownloadType, FoldersModel } from '../../options/shared/models/forms.model';
import { DownloadLookup, DownloadResult, DownloadSource } from '../models';
import { StorageService } from './storage';

@Service()
export class HttpService {
  private readonly _http = inject(HttpClient);
  private readonly _storage = inject(StorageService);
  private readonly _appUrl = computed(() => this._storage.state().settings.appUrl);

  connect(url: string): Observable<{ ok: boolean }> {
    if (!url?.trim()?.length) return of({ ok: false });
    return this._http.get<{ ok: boolean }>(`${url}/api/health`);
  }

  download(source: DownloadSource, type: DownloadType): Observable<DownloadResult> {
    if (!source?.url?.trim()?.length) return throwError(() => new Error('App URL is required'));

    const body = downloadPayload(this._storage.state(), source, type);
    return this._http.post<DownloadResult>(`${this._appUrl()}/api/downloads`, body);
  }

  /** The latest download of every item the URL stands for, per type; empty lists when never downloaded. */
  lookup(url: string): Observable<DownloadLookup> {
    return this._http.get<DownloadLookup>(`${this._appUrl()}/api/downloads/lookup`, { params: { url } });
  }

  getFolders(): Observable<FoldersModel> {
    return this._http.get<FoldersModel>(`${this._appUrl()}/api/folders`).pipe(
      catchError(async () => ({ root: '', folders: [] })),
    );
  }
  donwloadCustom(source: DownloadSource, body: CardFormValue): Observable<DownloadResult> {

    return this._http.post<DownloadResult>(`${this._appUrl()}/api/downloads`, { url: source.url, ...body });
  }
}
