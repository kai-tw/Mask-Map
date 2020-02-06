(function(d,s,u){
	let j = d.createElement(s);
	j.async = true;
	j.onload = main;
	j.src=u;
	d.head.appendChild(j);
})(document,"script","leaflet/leaflet.js");
function main() {
	let map = L.map("app"),
		osmUrl='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
		osm = new L.TileLayer(osmUrl, {minZoom: 8, maxZoom: 16});
	map.setView(new L.LatLng(25.034672,121.5244748), 12);
	map.addLayer(osm);
	
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(function(){
			alert("位置取得成功");
		},function(){
			alert("位置取得失敗");
		});
	}
	else {
		alert("您的瀏覽器不支援定位");
	}
}