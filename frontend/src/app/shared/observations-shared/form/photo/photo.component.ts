/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Component,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  Input,
  ViewChild,
  ElementRef,
  Inject,
  LOCALE_ID,
  forwardRef,
  HostListener,
  HostBinding
} from '@angular/core';
import { SafeUrl, DomSanitizer } from '@angular/platform-browser';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

import { AppConfig } from '@conf/app.config';
import { AppConfigInterface } from '@models/app-config.model';
import { extractLatLon } from './exif-meta';

type AppConfig = Pick<AppConfigInterface, 'IMAGE_EXTENSIONS'>;
const IMAGE_EXTENSIONS = AppConfig.IMAGE_EXTENSIONS;

@Component({
  selector: 'app-form-photo',
  templateUrl: './photo.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhotoComponent),
      multi: true
    }
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PhotoComponent implements ControlValueAccessor {
  @Input() onLatLon: ((lat: number, lon: number) => void | undefined) | undefined;
  @Input() multiple: string | boolean = false;
  @HostBinding('class.active') active = false;
  @ViewChild('photo', { static: true }) photoElement!: ElementRef;
  photoFilename = '';
  photoTrustedURL: SafeUrl | null = null;

  private onChange = (val: File[] | File | null): void => {};
  private onTouched = (): void => {};

  writeValue(value: FileList | null): void {
    this.photoElement.nativeElement.files =
      value instanceof FileList && value.length > 0 ? value : null;
  }

  registerOnChange(fn: (val: File[] | File | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.photoElement.nativeElement.disabled = isDisabled;
  }

  constructor(@Inject(LOCALE_ID) readonly localeId: string, private sanitizer: DomSanitizer) {}

  performUpdate(files: File[]): void {
    const fileList: FileList = this.photoElement?.nativeElement.files;
    if (files.length > 0) {
      this.onTouched();
      // TODO: prompt user to strip gps/datetime/thumbnail/make/model  exif tags?
      this.writeValue(fileList);

      if (this.photoElement.nativeElement.multiple) {
        this.onChange(files);
        // ui logic for multiple images … ?
        // - mosaic: canvas(complex for ≠ aspect ratios!), https://github.com/lukechilds/merge-images
        // - mini carousel
        this.makeThumbnail(files[0]);
        this.photoFilename = `${files.length} photos`;
        return;
      } else {
        this.onChange(files[0]);
        this.makeThumbnail(files[0]);
        this.photoFilename = files[0].name || 'photo';
        this.getLatLon(files[0]);
      }
    }
  }

  onPhotoUpdate(): void {
    const fileList: FileList = this.photoElement?.nativeElement.files;
    const files: File[] = [];
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < fileList.length; i++) {
      if (this.isAcceptableAsImage(fileList[i])) {
        files.push(fileList[i]);
      }
    }
    this.performUpdate(files);
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.active = false;
    const { dataTransfer } = event;
    if (dataTransfer) {
      dataTransfer.dropEffect = 'copy';
      if (dataTransfer.items.length > 0) {
        const files: File[] = [];
        // tslint:disable-next-line: prefer-for-of
        for (let i = 0; i < dataTransfer.items.length; i++) {
          if (
            dataTransfer.items[i].kind === 'file' &&
            this.isAcceptableAsImage(dataTransfer.items[i])
          ) {
            const asFile = dataTransfer.items[i].getAsFile();
            if (asFile) {
              files.push(asFile);
            }
          }
        }
        dataTransfer.items.clear();

        this.performUpdate(files);
      }
    }
  }

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.active = true;
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent): void {
    this.active = false;
  }

  @HostListener('body:dragover', ['$event'])
  onBodyDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  @HostListener('body:drop', ['$event'])
  onBodyDrop(event: DragEvent): void {
    event.preventDefault();
  }

  acceptExtensionList = (): string => {
    let acceptList = '';
    for (const ext of IMAGE_EXTENSIONS) {
      acceptList += `, .${ext}`;
    }
    return acceptList;
  };

  isAcceptableAsImage(file: File | DataTransferItem): boolean {
    if (file instanceof File && !file.name) {
      console.warn('The File.name property does not appear to be supported on this browser.');
      return false;
    }

    if (!file.type) {
      console.warn('The File.type property does not appear to be supported on this browser.');
      return false;
    }

    // DnD guard
    if (!file.type.startsWith('image/')) {
      console.warn('File is not an image.', file.type, file);
      return false;
    }

    // DnD guard
    if (!IMAGE_EXTENSIONS.has(file.type.split('/')[1].toLowerCase())) {
      console.warn('Image extension is not supported.', file.type, file);
      return false;
    }

    return true;
  }

  makeThumbnail(file: File): void {
    const objectURL = window.URL.createObjectURL(file);
    this.photoTrustedURL = this.sanitizer.bypassSecurityTrustResourceUrl(objectURL);
    setTimeout(() => {
      URL.revokeObjectURL(objectURL);
    }, 150);
  }

  getLatLon(file: File): void {
    const reader = new FileReader();
    reader.onload = (): void => {
      const [latitude, longitude] = extractLatLon(reader.result) || [];
      if (this.onLatLon && latitude && longitude) {
        this.onLatLon(latitude, longitude);
      }
    };
    reader.onerror = (error): void => {
      console.warn('Error reading EXIF data:', error);
    };
    reader.readAsArrayBuffer(file);
  }
}
