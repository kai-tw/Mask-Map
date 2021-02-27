<?php
$geo = json_decode(file_get_contents('https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json'), true);

foreach ($geo['features'] as &$item) {
	$id = $item['properties']['id'];
	$item['properties'] = array('id'=>$id);
	foreach ($item['geometry']['coordinates'] as &$cood) {
		$cood = number_format($cood, 6);
	}
	unset($cood);
}
unset($item);
echo sizeof($geo['features']), PHP_EOL;
file_put_contents('../data/rawdata.json', json_encode($geo, JSON_PRETTY_PRINT));
echo PHP_EOL;