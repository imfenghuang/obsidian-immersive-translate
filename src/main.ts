import { Plugin } from 'obsidian';
import { clearStorage, restoreTranslate } from './utils';
import { Settings, ImtConfig } from './type';
import { SettingTab, defaultPageRule, defaultLiteSettings } from './setting';

declare global {
	interface Window {
		immersiveTranslateConfig?: ImtConfig;
		initImmersiveTranslate?: (config: ImtConfig) => void;
		destroyImmersiveTranslate?: () => void;
	}
}

const SDK_URL =
	'https://download.immersivetranslate.com/immersive-translate-sdk-latest.js';

const SDK_LITE_URL =
	'https://download.immersivetranslate.com/immersive-translate-sdk-lite-latest.js';

export default class ImtPlugin extends Plugin {
	settings: Settings;
	settingTab: SettingTab;
	$el: HTMLElement;

	mouseDown: (e: MouseEvent) => void;
	mouseMove: (e: MouseEvent) => void;
	mouseUp: (e: MouseEvent) => void;

	async onload() {
		// load settings
		await this.loadSettings();

		// setting
		this.settingTab = new SettingTab(this.app, this);
		this.addSettingTab(this.settingTab);

		if (!window.immersiveTranslateConfig) {
			const {
				disclaimerPoint,
				mountPoint,
				partnerId,
				isShowDisclaimer,
				sdkType,
				...rest
			} = this.settings;

			window.immersiveTranslateConfig = {
				partnerId,
				disclaimerPoint,
				mountPoint,
				pageRule: JSON.parse(JSON.stringify(rest)),
			};

			const isLite = sdkType === 'Lite';
			const sdkUrl = isLite ? SDK_LITE_URL : SDK_URL;

			const script = document.createElement('script');
			script.classList.add('imt-script');
			script.async = true;
			script.src = sdkUrl;
			script.onload = () => {
				setTimeout(() => {
					if (isLite) {
						if (
							!document.querySelector(
								'#immersiveTranslate-translation-button-wrapper'
							)
						) {
							const div = document.createElement('div');
							div.id = 'immersiveTranslate-translation-button';

							const wrapper = document.createElement('div');
							wrapper.id =
								'immersiveTranslate-translation-button-wrapper';
							wrapper.append(div);

							const disclaimerDiv = document.createElement('div');
							disclaimerDiv.id =
								'immersiveTranslate-disclaimer-wrapper';
							disclaimerDiv.style.display = isShowDisclaimer
								? 'block'
								: 'none';
							wrapper.append(disclaimerDiv);

							document.body.append(wrapper);
							this.$el = wrapper;

							let offsetX = 0,
								offsetY = 0,
								isDragging = false,
								offsetWidth = 0,
								offsetHeight = 0;

							const mouseDownHandler = (e: MouseEvent) => {
								isDragging = true;
								const rect = wrapper.getBoundingClientRect();
								offsetX = e.clientX - rect.left;
								offsetY = e.clientY - rect.top;
								offsetWidth = rect.width;
								offsetHeight = rect.height;
								document.addEventListener(
									'mousemove',
									mouseMoveHandler
								);
								document.addEventListener(
									'mouseup',
									mouseUpHandler
								);
							};

							const mouseMoveHandler = (e: MouseEvent) => {
								if (!isDragging) return;
								wrapper.style.left = `${e.clientX - offsetX < 0 ? 0 : e.clientX - offsetX > window.innerWidth - offsetWidth ? window.innerWidth - offsetWidth : e.clientX - offsetX}px`;
								wrapper.style.top = `${e.clientY - offsetY < 0 ? 0 : e.clientY - offsetY > window.innerHeight - offsetHeight ? window.innerHeight - offsetHeight : e.clientY - offsetY}px`;
								wrapper.style.right = 'unset';
								wrapper.style.bottom = 'unset';
								wrapper.style.position = 'fixed';
							};

							const mouseUpHandler = () => {
								isDragging = false;
								document.removeEventListener(
									'mousemove',
									mouseMoveHandler
								);
								document.removeEventListener(
									'mouseup',
									mouseUpHandler
								);
							};

							wrapper.addEventListener(
								'mousedown',
								mouseDownHandler
							);

							// save event handlers
							this.mouseDown = mouseDownHandler;
							this.mouseMove = mouseMoveHandler;
							this.mouseUp = mouseUpHandler;
						}
						return;
					}

					const shadowRoot = document.querySelector(
						'#immersive-translate-popup'
					)?.shadowRoot;
					// hide closeBtn
					if (shadowRoot) {
						const closeBtn = shadowRoot.querySelector(
							'.imt-fb-container>div'
						) as HTMLElement;
						if (closeBtn) {
							closeBtn.style.display = 'none';
						}
					}
				}, 1000);
			};

			document.body.append(script);
		}
	}

	async onunload() {
		const imtPopup = document.querySelector('#immersive-translate-popup');
		const html = document.querySelector('html');
		const state = html?.getAttribute?.('imt-state');
		state === 'dual' && restoreTranslate();

		const imtScript = document.querySelector('.imt-script');
		const styleList = [
			...document.querySelectorAll('[data-id*="immersive-translate"]'),
		];
		const removeList: Element[] = [];
		[imtPopup, imtScript, styleList]
			.filter((v) => !!v)
			.forEach((v) =>
				Array.isArray(v)
					? v.forEach((s) => s && removeList.push(s))
					: v && removeList.push(v)
			);
		removeList.forEach((v) => v?.remove?.());

		document
			.querySelectorAll(`[data-immersive-translate-walked]`)
			?.forEach((v) =>
				v.removeAttribute('data-immersive-translate-walked')
			);

		html?.removeAttribute('imt-state');
		html?.removeAttribute('imt-trans-position');

		if (this.$el) {
			this.$el.removeEventListener('mousedown', this.mouseDown);
			document.removeEventListener('mousemove', this.mouseMove);
			document.removeEventListener('mouseup', this.mouseUp);
			this.$el.remove();

			window?.destroyImmersiveTranslate?.();
		}

		await clearStorage();
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			JSON.parse(JSON.stringify(defaultPageRule.pageRule)),
			JSON.parse(JSON.stringify(defaultLiteSettings)),
			await this.loadData()
		);
	}
}
