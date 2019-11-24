import { SafeHtml } from '@angular/platform-browser';

export interface Program {
  id_program: number;
  title: string;
  short_desc: string;
  long_desc: string;
  html_short_desc: SafeHtml;
  html_long_desc: SafeHtml;
  image: string;
  logo: string;
  module: number;
  taxonomy_list: number;
  on_sidebar: Boolean;
}
