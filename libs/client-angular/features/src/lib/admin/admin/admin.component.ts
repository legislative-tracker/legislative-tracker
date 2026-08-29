import {
  Component,
  inject,
  signal,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  FormArray,
  FormGroup,
} from '@angular/forms';
import {
  DragDropModule,
  CdkDragDrop,
  moveItemInArray,
} from '@angular/cdk/drag-drop';

import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';

import { RouterLink } from '@angular/router';

import { MatTabsModule } from '@angular/material/tabs';
import {
  RuntimeConfig,
  ResourceLink,
  ModePaletteConfig,
  ThemePalettesConfig,
} from '@legislative-tracker/shared/models';
import {
  ConfigService,
  ThemeService,
} from '@legislative-tracker/client-angular/core';

/**
 * Top-level administrative console for managing organization metadata, branding palettes,
 * custom theme overrides, and resource links.
 */
@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    DragDropModule,
    MatExpansionModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    MatIconModule,
    MatSnackBarModule,
    MatDividerModule,
    MatCardModule,
    MatTooltipModule,
    MatTabsModule,
  ],
  templateUrl: './admin.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './admin.component.scss',
})
export class Admin {
  private fb = inject(FormBuilder);
  private configService = inject(ConfigService);
  private themeService = inject(ThemeService, { optional: true });
  private snackBar = inject(MatSnackBar);

  readonly panelOpenState = signal(false);
  readonly isSaving = signal(false);

  form = this.fb.group({
    organization: this.fb.group({
      name: ['', Validators.required],
      url: ['', Validators.required],
    }),
    branding: this.fb.group({
      primaryColor: [
        '#673ab7',
        [Validators.required, Validators.pattern(/^#[0-9A-F]{6}$/i)],
      ],
      logoUrl: ['', Validators.required],
      faviconUrl: ['favicon.ico'],
      darkMode: [false],
      palettes: this.fb.group({
        enabled: [false],
        light: this.createModePaletteGroup(),
        dark: this.createModePaletteGroup(),
      }),
    }),
    resources: this.fb.array([]),
  });

  get resourcesArray() {
    return this.form.get('resources') as FormArray;
  }

  get palettesGroup() {
    return this.form.get('branding.palettes') as FormGroup;
  }

  get lightPaletteGroup() {
    return this.form.get('branding.palettes.light') as FormGroup;
  }

  get darkPaletteGroup() {
    return this.form.get('branding.palettes.dark') as FormGroup;
  }

  constructor() {
    effect(() => {
      const config = this.configService.config();
      if (config) {
        this.form.patchValue(
          {
            organization: config.organization,
            branding: {
              ...config.branding,
              palettes: {
                enabled: config.branding?.palettes?.enabled ?? false,
                light: config.branding?.palettes?.light ?? {},
                dark: config.branding?.palettes?.dark ?? {},
              },
            },
          },
          { emitEvent: false },
        );

        this.resourcesArray.clear({ emitEvent: false });
        const resources = config.resources || [];
        resources.forEach((res) => {
          this.resourcesArray.push(this.createResourceGroup(res), {
            emitEvent: false,
          });
        });
      }
    });

    this.form.get('branding')?.valueChanges.subscribe((brandingVal) => {
      if (this.themeService && brandingVal) {
        if (brandingVal.palettes) {
          this.themeService.setPalettes(brandingVal.palettes as any, false);
        }
        if (
          brandingVal.primaryColor &&
          /^#[0-9A-F]{6}$/i.test(brandingVal.primaryColor)
        ) {
          const isDark =
            brandingVal.darkMode !== undefined
              ? Boolean(brandingVal.darkMode)
              : this.themeService.isDarkMode();
          this.themeService.applyTheme(brandingVal.primaryColor, isDark);
        }
      }
    });
  }

  private createModePaletteGroup(data?: ModePaletteConfig): FormGroup {
    return this.fb.group({
      primary: [
        data?.primary || '',
        [Validators.pattern(/^$|^#[0-9A-F]{6}$/i)],
      ],
      secondary: [
        data?.secondary || '',
        [Validators.pattern(/^$|^#[0-9A-F]{6}$/i)],
      ],
      tertiary: [
        data?.tertiary || '',
        [Validators.pattern(/^$|^#[0-9A-F]{6}$/i)],
      ],
      neutral: [
        data?.neutral || '',
        [Validators.pattern(/^$|^#[0-9A-F]{6}$/i)],
      ],
      neutralVariant: [
        data?.neutralVariant || '',
        [Validators.pattern(/^$|^#[0-9A-F]{6}$/i)],
      ],
      error: [data?.error || '', [Validators.pattern(/^$|^#[0-9A-F]{6}$/i)]],
    });
  }

  async generatePaletteFromPrimary(mode: 'light' | 'dark' | 'both' = 'both') {
    const primaryHex =
      this.form.get('branding.primaryColor')?.value || '#673ab7';
    try {
      const { argbFromHex, CorePalette, hexFromArgb } =
        await import('@material/material-color-utilities');
      const argb = argbFromHex(primaryHex);
      const core = CorePalette.of(argb);

      const lightPalette: ModePaletteConfig = {
        primary: hexFromArgb(core.a1.tone(40)),
        secondary: hexFromArgb(core.a2.tone(40)),
        tertiary: hexFromArgb(core.a3.tone(40)),
        neutral: hexFromArgb(core.n1.tone(98)),
        neutralVariant: hexFromArgb(core.n2.tone(90)),
        error: hexFromArgb(core.error.tone(40)),
      };

      const darkPalette: ModePaletteConfig = {
        primary: hexFromArgb(core.a1.tone(80)),
        secondary: hexFromArgb(core.a2.tone(80)),
        tertiary: hexFromArgb(core.a3.tone(80)),
        neutral: hexFromArgb(core.n1.tone(10)),
        neutralVariant: hexFromArgb(core.n2.tone(30)),
        error: hexFromArgb(core.error.tone(80)),
      };

      const palettesGroup = this.form.get('branding.palettes') as FormGroup;
      if (mode === 'light' || mode === 'both') {
        palettesGroup.get('light')?.patchValue(lightPalette);
      }
      if (mode === 'dark' || mode === 'both') {
        palettesGroup.get('dark')?.patchValue(darkPalette);
      }
      this.form.markAsDirty();
      this.snackBar.open(
        'Generated palette swatches from primary color.',
        'Close',
        {
          duration: 3000,
        },
      );
    } catch (e) {
      console.error('Failed to generate palette from primary', e);
    }
  }

  private createResourceGroup(data?: ResourceLink): FormGroup {
    return this.fb.group({
      title: [data?.title || '', Validators.required],
      url: [data?.url || '', Validators.required],
      description: [data?.description || ''],
      icon: [data?.icon || 'link'],
      actionLabel: [data?.actionLabel || 'Open'],
    });
  }

  addResource() {
    this.resourcesArray.push(this.createResourceGroup());
    this.form.markAsDirty();
  }

  removeResource(index: number) {
    this.resourcesArray.removeAt(index);
    this.form.markAsDirty();
  }

  drop(event: CdkDragDrop<any[]>) {
    if (event.previousIndex === event.currentIndex) return;

    const movedControl = this.resourcesArray.at(event.previousIndex);

    this.resourcesArray.removeAt(event.previousIndex);

    this.resourcesArray.insert(event.currentIndex, movedControl);

    this.form.markAsDirty();
  }

  async saveConfig() {
    if (this.form.invalid) {
      this.snackBar.open('Please check the form for errors.', 'Close', {
        duration: 3000,
      });
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const formValue = this.form.getRawValue() as RuntimeConfig;

    try {
      await this.configService.save(formValue);
      this.snackBar.open('Configuration saved successfully', 'Close', {
        duration: 3000,
      });
    } catch (err) {
      console.error(err);
      this.snackBar.open('Error saving configuration', 'Close', {
        duration: 5000,
        panelClass: 'error-snack',
      });
    } finally {
      this.isSaving.set(false);
    }
  }

  resetForm() {
    const config = this.configService.config();
    this.form.patchValue(config);
    this.resourcesArray.clear();
    (config.resources || []).forEach((res) =>
      this.resourcesArray.push(this.createResourceGroup(res)),
    );
  }
}
