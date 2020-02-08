'use strict';

require(["pace.min","leaflet"],function(){
	require(["leaflet.markercluster"],function(){
		let map = L.map("app", {attributionControl:false,zoomControl:false,preferCanvas:true}),
			osmUrl='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
			osm = new L.TileLayer(osmUrl, {minZoom: 3, maxZoom: 19}),
			today = new Date(),
			currentIcon = L.icon({iconUrl:"images/current.svg",className:"animation",iconSize:[24,24]}),
			currentMar = L.marker([0,0], {icon: currentIcon}),
			storeIcon = [
				L.icon({iconUrl:"images/sold-out.svg",className:"animation",iconSize:[48,48],iconAnchor:[24,48],popupAnchor:[0,-48]}),
				L.icon({iconUrl:"images/emergency.svg",className:"animation",iconSize:[48,48],iconAnchor:[24,48],popupAnchor:[0,-48]}),
				L.icon({iconUrl:"images/warning.svg",className:"animation",iconSize:[48,48],iconAnchor:[24,48],popupAnchor:[0,-48]}),
				L.icon({iconUrl:"images/sufficient.svg",className:"animation",iconSize:[48,48],iconAnchor:[24,48],popupAnchor:[0,-48]})
			],
			storeClass = ["sold-out","emergency","warning","sufficient"],
			purchase = {day:["日","一","二","三","四","五","六"],parity:["不限","奇數","偶數","奇數","偶數","奇數","偶數"]},
			xhr = new XMLHttpRequest(),
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
				},
				removeOutsideVisibleBounds: true
			});
		
		map.setView([23.97565,120.97388], 6);
		map.addLayer(osm);
		map.setMaxBounds([[90,-180], [-90,180]]);
		document.getElementById("parity").innerText = purchase.parity[today.getDay()];
		document.getElementById("day").innerText = "星期" + purchase.day[today.getDay()];
		document.getElementById("zoom-in").addEventListener("click",function(){map.zoomIn()});
		document.getElementById("zoom-out").addEventListener("click",function(){map.zoomOut()});
		document.getElementById("current-location").addEventListener("click",function(){
			map.flyTo(currentMar.getLatLng(),16);
		});
		document.getElementById("menu").addEventListener("click",function(){
			document.getElementById("information").classList.toggle("open");
		});
		xhr.addEventListener("load", function(){
			let data = JSON.parse(this.responseText);
			data.features.forEach(function(store){
				let storeLocation = store.properties.id === "5931033130" ? [25.006090,121.517612] : [store.geometry.coordinates[1],store.geometry.coordinates[0]];
				store.properties.phone = store.properties.phone.replace(/ /g,"");
				let marker = L.marker(storeLocation,{icon:storeIcon[markerOrder("adult",store.properties.mask_adult)]}),
					popupConfig = {maxWidth: "auto"},
					popupContent = L.DomUtil.create("div","store-information"),
					storeStatus = L.DomUtil.create("div","store-status",popupContent);
				popupContent.dataset.lat = storeLocation[0];
				popupContent.dataset.lng = storeLocation[1];
				for (let i = 0; i < 2; i++) {
					let	container = L.DomUtil.create("div","container",storeStatus),
						label = L.DomUtil.create("p","label",container),
						numContainer = L.DomUtil.create("p","number-container",container);
					switch (i) {
					case 0:
						label.innerText = "成人口罩數量";
						container.classList.add(storeClass[markerOrder("adult",store.properties.mask_adult)]);
						numContainer.innerHTML = "<span class='number'>" + store.properties.mask_adult + "</span> 片";
						break;
					case 1:
						label.innerText = "兒童口罩數量";
						container.classList.add(storeClass[markerOrder("child",store.properties.mask_child)]);
						numContainer.innerHTML = "<span class='number'>" + store.properties.mask_child + "</span> 片";
						break;
					}
				}
				let storeName = L.DomUtil.create("p","store-name",popupContent),
					storeAddr = L.DomUtil.create("p","store-address",popupContent),
					storePhon = L.DomUtil.create("p","store-phone",popupContent);
					storeName.innerHTML = store.properties.name + "<span class='store-distance'></span>";
					storeAddr.innerHTML = "<a href='https://www.google.com/maps?q=" + store.properties.name + "+" + store.properties.address + "' target='_blank'>" + store.properties.address + "</a>";
					storePhon.innerHTML = "<a href='tel:" + store.properties.phone + "'>" + store.properties.phone + "</a>";
				marker.bindPopup(popupContent,popupConfig);
				storeMarkers.addLayer(marker);
			});
			if (navigator.geolocation) {
				let pos = navigator.geolocation.watchPosition(function(geo){
					currentMar.setLatLng([geo.coords.latitude,geo.coords.longitude]);
					currentMar.bindPopup("<p class='user-location'>目前位置</p><p class='loc-accuracy'>GPS 精確度："+geo.coords.accuracy+" 公尺</p>");
					currentMar.addTo(map);
					
					storeMarkers.eachLayer(function(layer){
						layer._popup._content.getElementsByClassName("store-distance")[0].innerText = geoDistance([[geo.coords.latitude,geo.coords.longitude],[layer._popup._content.dataset.lat,layer._popup._content.dataset.lng]]);
					});
				},function(){},{enableHighAccuracy:true,timeout:5000});
			}
			map.addLayer(storeMarkers);
		});
		xhr.open("GET", "https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json");
		xhr.send();
		Pace.start();
	});
});
function markerOrder(str,num) {
	let rate;
	switch (str) {
	case "adult":
		rate = num / 200;
		return rate >= 0.5 ? 3 : rate >= 0.2 ? 2 : rate > 0 ? 1 : 0;
	case "child":
		rate = num / 50;
		return rate >= 0.5 ? 3 : rate >= 0.2 ? 2 : rate > 0 ? 1 : 0;
	}
}
function geoDistance(arr) {
	for (let i = 0; i < 2; i++)
		for (let j = 0; j < 2; j++)
			arr[i][j] = arr[i][j] / 180 * Math.PI;
	let EARTH_RADIUS = 6371000,
		d = 2 * EARTH_RADIUS * Math.asin(Math.sqrt(Math.pow(Math.sin((arr[1][0] - arr[0][0]) / 2),2) + Math.cos(arr[0][0]) * Math.cos(arr[1][0]) * Math.pow(Math.sin((arr[1][1] - arr[0][1]) / 2),2)));
	
	d = d > 1000 ? (d / 1000).toFixed(2) + "km" : d.toFixed(2) + "m";
	return d;
}