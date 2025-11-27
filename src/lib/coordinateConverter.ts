/**
 * 緯度経度を3D空間の座標に変換する
 * @param latitude 緯度
 * @param longitude 経度
 * @param altitude 高度 (m)
 * @param reference 系の基準点 (通常は最初のウェイポイント)
 * @returns [x, y, z] 3D座標
 */
export const convertLatLonTo3D = (
  latitude: number,
  longitude: number,
  altitude: number,
  reference: { latitude: number; longitude: number }
): [number, number, number] => {
  // 地球の半径 (メートル)
  const EARTH_RADIUS = 6371000;
  
  // 基準点からの差分をラジアンに変換
  const dLat = (latitude - reference.latitude) * Math.PI / 180;
  const dLon = (longitude - reference.longitude) * Math.PI / 180;
  
  // 基準点の緯度をラジアンに変換
  const refLatRad = reference.latitude * Math.PI / 180;
  
  // 平面近似を使用してXとZを計算
  // X: 東西方向 (経度差)
  // Z: 南北方向 (緯度差)
  const x = EARTH_RADIUS * dLon * Math.cos(refLatRad);
  const z = EARTH_RADIUS * dLat;
  
  // 高度はそのままY座標として使用 (スケールを調整)
  const y = altitude;
  
  // シーンのスケールを調整 (より大きなスケールで見やすく)
  const SCALE = 0.01;
  
  return [
    x * SCALE,
    y * 0.01, // 高度もスケール調整
    z * SCALE
  ];
};

/**
 * 3D座標を緯度経度に変換する（逆変換）
 * @param x 3D空間のX座標
 * @param y 3D空間のY座標
 * @param z 3D空間のZ座標
 * @param reference 基準点
 * @returns {latitude, longitude, altitude}
 */
export const convert3DToLatLon = (
  x: number,
  y: number,
  z: number,
  reference: { latitude: number; longitude: number }
): { latitude: number; longitude: number; altitude: number } => {
  const EARTH_RADIUS = 6371000;
  const SCALE = 0.01;
  
  // スケールを元に戻す
  const realX = x / SCALE;
  const realZ = z / SCALE;
  const realY = y / 0.01;
  
  // 基準点の緯度をラジアンに変換
  const refLatRad = reference.latitude * Math.PI / 180;
  
  // 緯度経度差を計算
  const dLat = realZ / EARTH_RADIUS;
  const dLon = realX / (EARTH_RADIUS * Math.cos(refLatRad));
  
  // ラジアンから度に変換
  const latitude = reference.latitude + (dLat * 180 / Math.PI);
  const longitude = reference.longitude + (dLon * 180 / Math.PI);
  const altitude = Math.max(10, realY); // 最低高度10m
  
  return { latitude, longitude, altitude };
};

/**
 * 複数のウェイポイントを3D座標に変換
 * latitude/longitudeの値が相対座標として使用される（シーン内の位置）
 */
export const convertWaypointsTo3D = (
  waypoints: Array<{ latitude: number; longitude: number; altitude: number }>,
  referenceIndex = 0
) => {
  if (waypoints.length === 0) return [];

  // latitude/longitudeを直接X/Z座標として使用（相対座標モード）
  // これはシーン内の位置を表す
  return waypoints.map(wp => ({
    ...wp,
    position: [wp.longitude, wp.altitude * 0.5, wp.latitude] as [number, number, number]
  }));
};