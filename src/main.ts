import { Plugin } from 'obsidian';
import { clearStorage, restoreTranslate } from './utils';
import { Settings, ImtConfig } from './type';
import { SettingTab, defaultPageRule } from './setting';

declare global {
	interface Window {
		immersiveTranslateConfig?: ImtConfig;
		initImmersiveTranslate?: (config: ImtConfig) => void;
	}
}

const SDK_URL =
	'https://download.immersivetranslate.com/immersive-translate-sdk-latest.js';

export default class ImtPlugin extends Plugin {
	settings: Settings;
	settingTab: SettingTab;
	async onload() {
		await this.loadSettings();

		// setting
		this.settingTab = new SettingTab(this.app, this);
		this.addSettingTab(this.settingTab);

		if (!window.immersiveTranslateConfig) {
			window.immersiveTranslateConfig = {
				pageRule: JSON.parse(JSON.stringify(this.settings)),
			};

			const script = document.createElement('script');
			script.classList.add('imt-script');
			script.async = true;
			script.src = SDK_URL;
			script.onload = () => {
				setTimeout(() => {
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

		await clearStorage();
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			JSON.parse(JSON.stringify(defaultPageRule.pageRule)),
			await this.loadData()
		);
	}
}
