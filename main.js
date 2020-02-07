require(["leaflet/leaflet"],function(){
	require(["leaflet/leaflet.markercluster.js"],function(){
		let map = L.map("app", {attributionControl:false,zoomControl:false,preferCanvas:true}),
			osmUrl='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
			osm = new L.TileLayer(osmUrl, {minZoom: 3, maxZoom: 19}),
			today = new Date(),
			currentPos = [],
			currentIcon = L.icon({iconUrl:"images/current.svg",className:"animation",iconSize:[24,24]}),
			currentMar = L.marker([0,0], {icon: currentIcon}),
			storeIcon = [
				L.icon({iconUrl:"images/sold-out.svg",className:"animation",iconSize:[48,48],iconAnchor:[24,48]}),
				L.icon({iconUrl:"images/emergency.svg",className:"animation",iconSize:[48,48],iconAnchor:[24,48]}),
				L.icon({iconUrl:"images/warning.svg",className:"animation",iconSize:[48,48],iconAnchor:[24,48]}),
				L.icon({iconUrl:"images/sufficient.svg",className:"animation",iconSize:[48,48],iconAnchor:[24,48]})
			],
			storeClass = ["sold-out","emergency","warning","sufficient"],
			purchase = {day:["日","一","二","三","四","五","六"],parity:["不限","奇數","偶數","奇數","偶數","奇數","偶數"]},
			xhr = new XMLHttpRequest(),
			data,
			storeMarkers = L.markerClusterGroup({
				iconCreateFunction: function(cluster) {
					let list = cluster.getAllChildMarkers(),
						order = 0;
					for (let i = 0; i < list.length; i++) {
						order = order < 3 && list[i].options.icon.options.iconUrl === storeIcon[3].options.iconUrl ? 3 :
								order < 2 && list[i].options.icon.options.iconUrl === storeIcon[2].options.iconUrl ? 2 :
								order < 1 && list[i].options.icon.options.iconUrl === storeIcon[1].options.iconUrl ? 1 :
								list[i].options.icon.options.iconUrl === storeIcon[0] ? 0 : order;
					}
					return L.divIcon({html:cluster.getChildCount(),className:"animation icon-cluster " + storeClass[order],iconSize:[72,30]});
				}
			});
		map.setView([25.034672,121.5244748], 15);
		map.addLayer(osm);
		map.setMaxBounds([[90,-180], [-90,180]]);
		if (navigator.geolocation) {
			let pos = navigator.geolocation.watchPosition(function(geo){
				currentPos = L.latLng(geo.coords.latitude,geo.coords.longitude);
				currentMar.setLatLng(currentPos);
				currentMar.addTo(map);
			},function(){
				alert("位置取得失敗");
			},{enableHighAccuracy:true});
		}
		else {
			alert("您的瀏覽器不支援定位");
		}
		document.getElementById("parity").innerText = purchase.parity[today.getDay()];
		document.getElementById("day").innerText = "星期" + purchase.day[today.getDay()];

		xhr.addEventListener("load", function(){
			data = JSON.parse(this.responseText);
			data.features.forEach(function(store){
				storeMarkers.addLayer(L.marker([store.geometry.coordinates[1],store.geometry.coordinates[0]],adultMarker(store.properties.mask_adult)));
			});
			map.addLayer(storeMarkers);
		});
		xhr.open("GET", "https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json");
		xhr.send();
	});
});
function adultMarker(num) {
	let suffIcon = L.icon({iconUrl:"images/sufficient.svg",className:"animation",iconSize:[48,48],iconAnchor:[24,48]}),
		warnIcon = L.icon({iconUrl:"images/warning.svg",className:"animation",iconSize:[48,48],iconAnchor:[24,48]}),
		emcyIcon = L.icon({iconUrl:"images/emergency.svg",className:"animation",iconSize:[48,48],iconAnchor:[24,48]}),
		soldIcon = L.icon({iconUrl:"images/sold-out.svg",className:"animation",iconSize:[48,48],iconAnchor:[24,48]}),
		rate = num / 200;
	return rate >= 0.5 ? {icon:suffIcon} : rate >= 0.2 ? {icon:warnIcon} : rate > 0 ? {icon:emcyIcon} : {icon:soldIcon};
}
function kidMarker(num) {
	let suffIcon = L.icon({iconUrl:"images/sufficient.svg",className:"animation",iconSize:[48,48],iconAnchor:[24,48]}),
		warnIcon = L.icon({iconUrl:"images/warning.svg",className:"animation",iconSize:[48,48],iconAnchor:[24,48]}),
		emcyIcon = L.icon({iconUrl:"images/emergency.svg",className:"animation",iconSize:[48,48],iconAnchor:[24,48]}),
		soldIcon = L.icon({iconUrl:"images/sold-out.svg",className:"animation",iconSize:[48,48],iconAnchor:[24,48]}),
		rate = num / 50;
	return rate >= 0.5 ? {icon:suffIcon} : rate >= 0.2 ? {icon:warnIcon} : rate > 0 ? {icon:emcyIcon} : {icon:soldIcon};
}