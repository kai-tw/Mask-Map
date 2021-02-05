'use strict';

const MAX_ADULT_STOCK = 1800,
      MAX_CHILD_STOCK = 200,
      FLY_TO_ZOOM = 19,
      UPDATE_DELAY = 30000,
      SOURCE_URL = "https://data.nhi.gov.tw/resource/mask/maskdata.csv";

require(["pace.min","leaflet"],function(){
	require(["leaflet.markercluster"],function(){
		let coordData = new XMLHttpRequest();
		coordData.addEventListener("load", function() {
			let map = L.map("app", {attributionControl:false,zoomControl:false,minZoom:3,maxZoom:19}),
				osmUrl="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
				osm = new L.TileLayer(osmUrl, {minZoom: 3, maxZoom: 19}),
				today = new Date(),
				currentIcon = L.icon({iconUrl:"images/current.svg",className:"animation",iconSize:[24,24]}),
				currentMar = L.marker([0,0], {icon: currentIcon}),
				storeIcon = [
					L.icon({iconUrl:"images/sold-out.svg",iconSize:[48,48],iconAnchor:[24,48],popupAnchor:[0,-48]}),
					L.icon({iconUrl:"images/emergency.svg",iconSize:[48,48],iconAnchor:[24,48],popupAnchor:[0,-48]}),
					L.icon({iconUrl:"images/warning.svg",iconSize:[48,48],iconAnchor:[24,48],popupAnchor:[0,-48]}),
					L.icon({iconUrl:"images/sufficient.svg",iconSize:[48,48],iconAnchor:[24,48],popupAnchor:[0,-48]})
				],
				storeClass = ["sold-out","emergency","warning","sufficient"],
				xhr = new XMLHttpRequest(),
				storeMarkers = L.markerClusterGroup({
					iconCreateFunction: function(cluster) {
						let list = cluster.getAllChildMarkers(),
							order = 0;
						for (let i = 0; i < list.length; i++) {
							order = order < 3 && list[i].options.icon.options.iconUrl === storeIcon[3].options.iconUrl ? 3 :
									order < 2 && list[i].options.icon.options.iconUrl === storeIcon[2].options.iconUrl ? 2 :
									order < 1 && list[i].options.icon.options.iconUrl === storeIcon[1].options.iconUrl ? 1 : order;
						}
						return L.divIcon({className:"icon-cluster " + storeClass[order],iconSize:[72,30]});
					},
					removeOutsideVisibleBounds: true,
					animate: true,
					maxClusterRadius: 40
				}),
				childrenStat = false,
				locationPermit = false,
				geoCollection = JSON.parse(this.responseText);
			
			map.addLayer(osm);
			
			map.setView([23.97565,120.97388], 8);
			map.setMaxBounds([[90,-180], [-90,180]]);
			document.getElementById("zoom-in").addEventListener("click", () => {map.zoomIn()});
			document.getElementById("zoom-out").addEventListener("click", () => {map.zoomOut()});
			document.getElementById("current-location").addEventListener("click",function(){
				if(locationPermit) {
					map.flyTo(currentMar.getLatLng(),18);
				}
				if (navigator.geolocation) {
					let pos = navigator.geolocation.watchPosition(function(geo){
						currentMar.setLatLng([geo.coords.latitude,geo.coords.longitude]);
						currentMar.bindPopup("<p class='user-location'>目前位置</p><p class='loc-accuracy'>GPS 精確度："+Math.round(geo.coords.accuracy * 100) / 100+" 公尺</p>");
						currentMar.addTo(map);
						storeMarkers.eachLayer(function(layer){
							layer.getPopup().getContent().getElementsByClassName("store-distance")[0].innerText = geoDistance([[geo.coords.latitude,geo.coords.longitude],[layer.getPopup().getContent().dataset.lat,layer.getPopup().getContent().dataset.lng]]);
						});
						document.getElementById("app").classList.add("allow-location");
						locationPermit = true;
					},function(){
						alert("定位資料取得失敗，故不能進行目前位置顯示");
						document.getElementById("app").classList.remove("allow-location");
						locationPermit = false;
						currentMar.remove();
					},{enableHighAccuracy:true});
				}
			});
			document.getElementById("menu").addEventListener("click",function(){
				document.getElementById("information").classList.toggle("close");
				this.classList.toggle("close");
			});
			document.getElementById("app").addEventListener("click", function () {
				if (document.documentElement.clientWidth <= 768 && !document.getElementById("information").classList.contains("close")) {
					document.getElementById("information").classList.add("close");
					document.getElementById("menu").classList.add("close");
				}
			});
			document.getElementById("mask-toggle").addEventListener("click",function(){
				this.classList.toggle("child");
				childrenStat = (childrenStat) ? false : true;
				if (childrenStat)
					storeMarkers.eachLayer(function(layer){
						layer.setIcon(storeIcon[markerOrder("child",layer.getPopup().getContent().getElementsByClassName("number")[1].innerText)]);
					});
				else
					storeMarkers.eachLayer(function(layer){
						layer.setIcon(storeIcon[markerOrder("adult",layer.getPopup().getContent().getElementsByClassName("number")[0].innerText)]);
					});
				storeMarkers.refreshClusters();
			});
			document.getElementById("help").addEventListener("click",function(){
				document.getElementById("guide").classList.toggle("open");
			});
			xhr.addEventListener("load", function(){
				let temp = csvParse(this.responseText);
				for (let i in geoCollection.features) {
					let id = geoCollection.features[i].properties.id;
					if (temp[id] == null) continue;
					geoCollection.features[i].properties = temp[id];
				}
				geoCollection.features.forEach(function(store){
					let storeLocation = [store.geometry.coordinates[1],store.geometry.coordinates[0]];
					let marker = L.marker(storeLocation,{icon:storeIcon[markerOrder("adult",store.properties.mask_adult)]}),
						popupConfig = {maxWidth: "auto"},
						popupContent = L.DomUtil.create("div","store-information"),
						storeStatus = L.DomUtil.create("div","store-status",popupContent);
					popupContent.dataset.lat = storeLocation[0];
					popupContent.dataset.lng = storeLocation[1];
					popupContent.dataset.id = store.properties.id;
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
						storeAddr = L.DomUtil.create("p","store-address detail",popupContent),
						storePhon = L.DomUtil.create("p","store-phone detail",popupContent),
						storeUpda = L.DomUtil.create("p","store-updated detail",popupContent);
					storeName.innerHTML = store.properties.name + "<span class='store-distance'></span>";
					storeAddr.innerHTML = "<span class='icon fas fa-map-marked-alt'></span><span class='text'><a href='https://www.google.com/maps?q=" + store.properties.name + "+" + store.properties.address + "' target='_blank'>" + store.properties.address + "</a></span>";
					storePhon.innerHTML = "<span class='icon fas fa-phone'></span><span class='text'><a href='tel:" + store.properties.phone + "'>" + store.properties.phone + "</a></span>";
					storeUpda.innerHTML = "<span class='icon fas fa-sync-alt'></span><span class='text'>" + store.properties.updated + "</span>";
					marker.bindPopup(popupContent,popupConfig).on("click",function(){
						location.hash = this.getPopup().getContent().dataset.id;
					});
					storeMarkers.addLayer(marker);
				});
				map.addLayer(storeMarkers);
				window.setInterval(function(){
					let updator = new XMLHttpRequest;
					let index = {};
					updator.addEventListener("load",function(){
						let temp = csvParse(this.responseText);
						for (let i in geoCollection.features) {
							let id = geoCollection.features[i].properties.id;
							if (temp[id] == null) continue;
							geoCollection.features[i].properties = temp[id];
						}
						for (let i in geoCollection["features"]) {
							index[geoCollection.features[i].properties.id] = i;
						}
						storeMarkers.eachLayer(function(layer){
							let dom = layer.getPopup().getContent(),
								id = dom.dataset.id,
								stat = geoCollection.features[index[id]],
								con = dom.getElementsByClassName("container"),
								num = dom.getElementsByClassName("number"),
								upd = dom.getElementsByClassName("store-updated")[0].children[1];
							con[0].setAttribute("class","container " + storeClass[markerOrder("adult",stat.properties.mask_adult)]);
							con[1].setAttribute("class","container " + storeClass[markerOrder("child",stat.properties.mask_child)]);
							num[0].innerText = stat.properties.mask_adult;
							num[1].innerText = stat.properties.mask_child;
							upd.innerHTML = stat.properties.updated;
							if (childrenStat)
								layer.setIcon(storeIcon[markerOrder("child",stat.properties.mask_child)]);
							else
								layer.setIcon(storeIcon[markerOrder("adult",stat.properties.mask_adult)]);
						});
						storeMarkers.refreshClusters();
						console.log("Updated");
					});
					updator.open("GET", SOURCE_URL + "?time=" + new Date().getTime());
					updator.send();
				},UPDATE_DELAY);
				if (location.hash != "") {
					storeMarkers.eachLayer(function(layer){
						let markerData = layer.getPopup().getContent().dataset;
						if(markerData.id == location.hash.substr(1)) {
							map.setView([markerData.lat,markerData.lng],FLY_TO_ZOOM);
							layer.openPopup();
							return this;
						}
					});
				}
			});
			xhr.open("GET", SOURCE_URL + "?time=" + new Date().getTime());
			xhr.send();
		});		
		coordData.open("GET", "data/rawdata.json");
		coordData.send();
	});
});
function markerOrder(str,num) {
	let rate;
	switch (str) {
	case "adult":
		rate = num / MAX_ADULT_STOCK;
		return rate >= 0.5 ? 3 : rate >= 0.2 ? 2 : rate > 0 ? 1 : 0;
	case "child":
		rate = num / MAX_CHILD_STOCK;
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
function csvParse(str) {
	let data = str.split(/\r?\n/), temp = new Object;
	data.shift();
	for (let i in data) {
		let rawdata = data[i].split(",");
		temp[rawdata[0]] = new Object;
		temp[rawdata[0]]["id"] = rawdata[0];
		temp[rawdata[0]]["name"] = rawdata[1];
		temp[rawdata[0]]["address"] = rawdata[2];
		temp[rawdata[0]]["phone"] = rawdata[3];
		temp[rawdata[0]]["mask_adult"] = rawdata[4];
		temp[rawdata[0]]["mask_child"] = rawdata[5];
		temp[rawdata[0]]["updated"] = rawdata[6];
	}
	return temp;
}