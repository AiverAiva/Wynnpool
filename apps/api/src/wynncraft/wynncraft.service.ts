import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class WynncraftService {
  private readonly BASE_URL = 'https://api.wynncraft.com/v3/publisher/articles';

  constructor(private readonly httpService: HttpService) {}

  async listArticles(type: string) {
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.BASE_URL}/list/${type}`).pipe(
        catchError((error: AxiosError) => {
          console.error(error.response?.data);
          throw new InternalServerErrorException('Failed to fetch articles');
        }),
      ),
    );
    return data;
  }

  async fetchArticle(type: string, id: string) {
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.BASE_URL}/fetch/${type}/${id}`).pipe(
        catchError((error: AxiosError) => {
          console.error(error.response?.data);
          throw new InternalServerErrorException('Failed to fetch article');
        }),
      ),
    );
    return data;
  }
}
