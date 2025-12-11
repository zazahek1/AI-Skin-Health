
import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService } from './services/gemini.service';
import { FullAnalysis } from './models/analysis.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
})
export class AppComponent {
  private readonly geminiService = inject(GeminiService);

  uploadedImage = signal<string | null>(null);
  uploadedImageType = signal<string | null>(null);
  uploadedFileName = signal<string | null>(null);
  fullAnalysis = signal<FullAnalysis | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  dragOver = signal<boolean>(false);

  handleFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.processFile(input.files[0]);
    }
  }
  
  handleDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(true);
  }

  handleDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
  }

  handleDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
    if (event.dataTransfer?.files?.length) {
      this.processFile(event.dataTransfer.files[0]);
    }
  }
  
  private processFile(file: File): void {
    if (!file.type.match(/image\/(png|jpeg)/)) {
        this.error.set('Invalid file type. Please upload a JPG or PNG image.');
        return;
    }

    this.resetState();
    this.uploadedFileName.set(file.name);
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.uploadedImage.set(e.target.result);
      this.uploadedImageType.set(file.type);
    };
    reader.readAsDataURL(file);
  }

  async analyzeImage(): Promise<void> {
    const image = this.uploadedImage();
    const imageType = this.uploadedImageType();
    if (!image || !imageType) return;
    
    this.isLoading.set(true);
    this.error.set(null);
    this.fullAnalysis.set(null);

    try {
      const base64Data = image.split(',')[1];
      const result = await this.geminiService.getAnalysisAndHealingVisuals(base64Data, imageType);
      this.fullAnalysis.set(result);
    } catch (err) {
      console.error('An error occurred during analysis:', err);
      this.error.set('Failed to analyze the image. The API key may be invalid or the model may be unavailable. Please try again later.');
    } finally {
      this.isLoading.set(false);
    }
  }
  
  removeImage(): void {
    this.resetState();
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if(fileInput) {
      fileInput.value = '';
    }
  }

  private resetState(): void {
    this.uploadedImage.set(null);
    this.uploadedImageType.set(null);
    this.uploadedFileName.set(null);
    this.fullAnalysis.set(null);
    this.isLoading.set(false);
    this.error.set(null);
  }
}
