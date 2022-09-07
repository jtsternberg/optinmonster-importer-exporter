window.omSettingsClone = window.omSettingsClone || {};

( function( window, document, cloner ) {
	'use strict';

	const objectExclude = (obj, excludeKeys = []) => {
		let newObj = {}
		Object.keys(obj).forEach(key => {
			if ( ! excludeKeys.includes(key) ) {
				newObj[key] = obj[key]
			}
		})
		return newObj
	}

	const download = function (txt, fileName) {
		var txt = JSON.stringify(txt);
		var dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(txt);
		const el = document.createElement('a');
		fileName = (fileName || 'export') + '.json';
		el.setAttribute('href', dataStr);
		el.setAttribute('download', fileName);
		document.body.appendChild(el);
		el.click();
		el.remove();

		return fileName;
	};

	const getApp = (key, object) => {
		if ( ! omWpApi || ! omWpApi.main ) {
			throw new Error('The `omWpApi` object is missing! Are you sure you are on the OptinMonster campaign output settings?')
		}

		if (key) {
			return omWpApi.main.app.$get.call(object || omWpApi.main.app, key, {})
		}

		return omWpApi.main.app;
	}

	const getCampaignMeta = (campaignId, exclude) => {
		const campaign = getApp('$store.getters')['campaigns/getCampaign'](campaignId)

		return JSON.parse( JSON.stringify(
			getApp('wp.post_meta', campaign)
		) )
	}

	cloner.campaignId = () => {
		const id = getApp('$route.params.campaignId');
		if ( ! id ) {
			throw new Error('No campaign Id found! Are you sure you are on the OptinMonster campaign output settings?')
		}
		return id;
	}

	cloner.getCloneData = (fromid) => {
		return objectExclude(
			getCampaignMeta(fromid),
			['_omapi_enabled', '_omapi_type', '_omapi_ids']
		)
	}

	cloner.import = function(metaToClone) {
		metaToClone = JSON.parse(metaToClone);
		const id = cloner.campaignId();

		const metaToUpdate = {
			...getCampaignMeta(id),
			...metaToClone,
		}

		getApp('$store').commit(
			'campaigns/updateCampaignMeta',
			{
				campaignId: id,
				meta: metaToUpdate,
			}
		)

		localStorage.removeItem('omwpapi-clone-export')

		alert('Import complete!');
	}

	cloner.export = function() {
		try {
			const id = cloner.campaignId();
			const metaToClone = cloner.getCloneData(id)

			const fileName = download(metaToClone, `${id}-output-settings`);

			alert(`Export file downloaded: ${fileName}`);
		} catch (err) {
			alert(`Data could not be exported! ${err.message}`);
			console.warn(`Data could not be exported! ${err.message}`, err);
		}
	}

	cloner.fileImport = function() {
		const file = this.files[0];
		if (!file) {
			return;
		}

		const handleImportError = (filename, err) => {
			console.warn(`Data could not be imported from ${filename}!`, err);
			alert(`Data could not be imported from ${filename}! ${err.message}`);
		}

		const reader = new FileReader()
		reader.readAsText(file, "UTF-8")
		reader.onload = function (evt) {
			try {
				cloner.import(evt.target.result)
			} catch (err) {
				handleImportError(file.name, err)
			}
		}
		reader.onerror = function (evt) {
			handleImportError(file.name, evt)
		}
	}

	cloner.addButtons = (from) => {
		if ( document.getElementById('om-cloner-export') ) {
			return
		}

		const $card = document.querySelector('.omapi-campaign-settings__right-column .omapi-card:last-of-type')
		if ( ! $card ) {
			return
		}

		const $newCard = document.createRange().createContextualFragment(`
			<div class="omapi-card omapi-rules-list__wrapper omapi-card__nofooter">
				<div class="omapi-card-title capital">
					Output Settings Import/Export
				</div>
				<div class="omapi-card-content">
				</div>
			</div>
		`);
		const $content = $newCard.querySelector('.omapi-card-content');
		const $import = document.createRange().createContextualFragment(`
			<input style="display:none;" id="om-cloner-import" type="file"/>
			<button type="button" class="omapi-button omapi-button__small">Import Settings</button>
		`);
		$import.querySelector('button').onclick = () => {
			const $importInput = document.getElementById('om-cloner-import');
			$importInput.click();
			$importInput.onchange = cloner.fileImport
		};

		const $exportBtn     = document.createElement('button')
		$exportBtn.type      ='button'
		$exportBtn.className = 'omapi-button omapi-button__small'
		$exportBtn.innerText = 'Export Settings'
		$exportBtn.id        = 'om-cloner-export'
		$exportBtn.onclick   = cloner.export;

		$content.append($exportBtn)
		$content.append($import)

		$card.parentElement.append($newCard)
	}

	const setupFetchListener = () => {
		getApp('$bus').$on('fetchedWpResources', () => {
			cloner.addButtons();
		});
	};

	const maybeAddButtons = (evt) => {
		const campaignId = getApp('detail.to.params.campaignId', evt);
		if (campaignId) {
			setTimeout(() => cloner.addButtons(), 500);
		}
	}
	document.addEventListener('omWp.Navigation.complete', maybeAddButtons);
	document.addEventListener('omWp.App.ready', setupFetchListener);
	if (omWpApi && omWpApi.ready && omWpApi.main.app) {
		setupFetchListener()
	}
} )( window, document, window.omSettingsClone );