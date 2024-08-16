import { App, PluginSettingTab, Component, Setting } from 'obsidian';
import ImgPlugin from './main';
import { getArrayStr, debounce } from './utils';
import { Settings } from './type';

export const defaultPageRule = {
	pageRule: {
		selectors: ['.markdown-reading-view *'],
		excludeSelectors: ['.markdown-reading-view .cm-inline-code'],
	},
};

export class SettingTab extends PluginSettingTab {
	private component: Component;
	private tempSettings: Pick<Settings, 'selectors' | 'excludeSelectors'>;
	private compareKeys: ['selectors', 'excludeSelectors'];
	private relaunchRef: Setting | undefined;
	name: string;

	constructor(
		app: App,
		public plugin: ImgPlugin
	) {
		super(app, plugin);
		this.component = new Component();
		this.compareKeys = ['selectors', 'excludeSelectors'];

		const obj = Object.fromEntries(
			this.compareKeys.map((v) => [v, this.plugin.settings[v]])
		) as Pick<Settings, 'selectors' | 'excludeSelectors'>;
		this.tempSettings = obj;
		this.relaunchRef = undefined;
	}

	getCompareStr(obj: Partial<Settings>) {
		const { selectors, excludeSelectors } = obj;
		return JSON.stringify({ selectors, excludeSelectors });
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
							this.plugin.settings[key] = this.tempSettings[key];
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
		const debounceChangeSelectorsFn = debounce(async (value) => {
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
			.addText((text) =>
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
		const debounceChangExcludeSelectorsFn = debounce(async (value) => {
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
		});
		new Setting(containerEl)
			.setName('ExcludeSelectors')
			.setDesc(`Array, default: ${getArrayStr(excludeSelectorsDefault)}`)
			.addText((text) =>
				text
					.setValue(excludeSelectorsValue)
					.onChange(debounceChangExcludeSelectorsFn)
			);

		this.relaunchRef = new Setting(containerEl);
	}

	hide(): void {
		this.component.unload();
	}
}
