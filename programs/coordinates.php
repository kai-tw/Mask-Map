<?php
$geo = json_decode(file_get_contents('https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json'), true)['features'];
$array = array();

foreach ($geo as $feature) {
	printf("\r%s", $feature['properties']['id']);
	$array[$feature['properties']['id']] = array();
	$array[$feature['properties']['id']][0] = number_format($feature['geometry']['coordinates'][0], 6);
	$array[$feature['properties']['id']][1] = number_format($feature['geometry']['coordinates'][1], 6);
}

file_put_contents('coordinates.json', json_encode($array, JSON_PRETTY_PRINT));
echo PHP_EOL;