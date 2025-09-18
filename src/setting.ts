import { App, PluginSettingTab, Component, Setting, debounce } from 'obsidian';
import ImgPlugin from './main';
import { getArrayStr } from './utils';
import { Settings } from './type';
import { SDKType } from './type';

export const defaultPageRule = {
	pageRule: {
		selectors: ['.markdown-reading-view *'],
		excludeSelectors: ['.markdown-reading-view .cm-inline-code'],
	},
};

export const defaultLiteSettings = {
	sdkType: 'Lite',
	isShowDisclaimer: true,
	partnerId: 'obsidian-immersive-translate',
	mountPoint: {
		selector: '#immersiveTranslate-translation-button',
		action: 'child',
	},
	disclaimerPoint: {
		selector: '#immersiveTranslate-disclaimer-wrapper',
		action: 'child',
	},
};

export class SettingTab extends PluginSettingTab {
	private component: Component;
	private tempSettings: Pick<
		Settings,
		'selectors' | 'excludeSelectors' | 'sdkType' | 'isShowDisclaimer'
	>;
	private compareKeys: [
		'selectors',
		'excludeSelectors',
		'sdkType',
		'isShowDisclaimer',
	];
	private relaunchRef: Setting | undefined;
	name: string;

	constructor(
		app: App,
		public plugin: ImgPlugin
	) {
		super(app, plugin);
		this.component = new Component();
		this.compareKeys = [
			'selectors',
			'excludeSelectors',
			'sdkType',
			'isShowDisclaimer',
		];

		const obj = Object.fromEntries(
			this.compareKeys.map((v) => [v, this.plugin.settings[v]])
		) as Pick<
			Settings,
			'selectors' | 'excludeSelectors' | 'sdkType' | 'isShowDisclaimer'
		>;
		this.tempSettings = obj;
		this.relaunchRef = undefined;
	}

	getCompareStr(obj: Partial<Settings>) {
		const { selectors, excludeSelectors, isShowDisclaimer } = obj;
		return JSON.stringify({
			selectors,
			excludeSelectors,
			isShowDisclaimer,
		});
	}

	compareSetting() {
		if (
			this.getCompareStr(this.plugin.settings) !==
				this.getCompareStr(this.tempSettings) &&
			this.relaunchRef
		) {
			this.relaunchRef
				.clear()
				.setName('Relaunch')
				.setDesc('settings is changed, it need to relaunch')
				.addButton((btn) => {
					btn.onClick(async () => {
						this.compareKeys.forEach((key) => {
							if (key in this.plugin.settings) {
								// @ts-expect-error
								this.plugin.settings[key] =
									this.tempSettings[key];
							}
						});
						await this.plugin.saveData(this.plugin.settings);
						window.location.reload();
					});
					btn.setButtonText('relaunch');
					btn.setClass('mod-cta');
				});
		} else if (this.relaunchRef) {
			this.relaunchRef.clear().setName('').setDesc('');
		}
	}

	display(): void {
		const { containerEl } = this;
		this.component.load();
		containerEl.empty();

		const tempSettings = this.tempSettings;

		// selectors
		const selectorsDefault = defaultPageRule.pageRule.selectors;
		const selectorsValue = getArrayStr(this.plugin.settings?.selectors);
		const debounceChangeSelectorsFn = debounce(async (value: string) => {
			try {
				const temp = JSON.parse(value);
				if (!temp.includes(selectorsDefault[0])) {
					temp.unshift(selectorsDefault[0]);
				}
				tempSettings.selectors = temp;
				this.compareSetting();
			} catch (e) {
				// empty
			}
		});
		new Setting(containerEl)
			.setName('Selectors')
			.setDesc(`Array, default: ${getArrayStr(selectorsDefault)}`)
			.addTextArea((text) =>
				text
					.setValue(selectorsValue)
					.onChange(debounceChangeSelectorsFn)
			);

		// excludeSelectors
		const excludeSelectorsDefault =
			defaultPageRule.pageRule.excludeSelectors;
		const excludeSelectorsValue = getArrayStr(
			this.plugin.settings?.excludeSelectors
		);
		const debounceChangExcludeSelectorsFn = debounce(
			async (value: string) => {
				try {
					const temp = JSON.parse(value);
					if (!temp.includes(excludeSelectorsDefault[0])) {
						temp.unshift(excludeSelectorsDefault[0]);
					}
					tempSettings.excludeSelectors = temp;
					this.compareSetting();
				} catch (e) {
					// empty
				}
			}
		);

		new Setting(containerEl)
			.setName('ExcludeSelectors')
			.setDesc(`Array, default: ${getArrayStr(excludeSelectorsDefault)}`)
			.addTextArea((text) =>
				text
					.setValue(excludeSelectorsValue)
					.onChange(debounceChangExcludeSelectorsFn)
			);

		new Setting(containerEl)
			.setName('SDK Type')
			.setDesc('SDK Type')
			.addDropdown((dropdown) => {
				dropdown.addOption('Lite', 'Lite');
				// dropdown.addOption('Full', 'Full');
				dropdown.setValue(this.plugin.settings.sdkType);
				dropdown.onChange((value) => {
					tempSettings.sdkType = value as SDKType;
					this.compareSetting();
				});
			});

		new Setting(containerEl)
			.setName('Is Show Disclaimer')
			.setDesc('Show Disclaimer')
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.isShowDisclaimer);
				toggle.onChange((value) => {
					tempSettings.isShowDisclaimer = value;
					this.compareSetting();
				});
			});

		this.relaunchRef = new Setting(containerEl);
	}

	hide(): void {
		this.component.unload();
	}
}
