// 机场数据服务

// 导入生成的机场JSON数据
import airportsData from './airports.json';

/**
 * 从CSV文件加载机场数据
 * @returns {Promise<Array>} 机场数据数组
 */
export const loadAirports = async () => {
  try {
    // 从JSON文件直接返回机场数据
    return airportsData;
  } catch (error) {
    console.error('加载机场数据失败:', error);
    // 出错时返回模拟数据
    return [
      { name: '北京首都国际机场', city: '北京', iata_code: 'PEK' },
      { name: '上海浦东国际机场', city: '上海', iata_code: 'PVG' },
      { name: '广州白云国际机场', city: '广州', iata_code: 'CAN' }
    ];
  }
};

/**
 * 根据IATA代码获取机场信息
 * @param {string} iataCode - 机场IATA代码
 * @returns {Promise<Object|null>} 机场信息
 */
export const getAirportByCode = async (iataCode) => {
  try {
    const airports = await loadAirports();
    return airports.find(airport => airport.iata_code === iataCode) || null;
  } catch (error) {
    console.error('根据IATA代码获取机场信息失败:', error);
    return null;
  }
};

/**
 * 获取机场代码到名称的映射表
 * @returns {Promise<Object>} 机场代码映射表
 */
export const getAirportMap = async () => {
  try {
    const airports = await loadAirports();
    const airportMap = {};
    airports.forEach(airport => {
      airportMap[airport.iata_code] = airport.name;
    });
    return airportMap;
  } catch (error) {
    console.error('获取机场映射表失败:', error);
    return {};
  }
};

/**
 * 获取所有城市的列表
 * @returns {Promise<Array>} 城市列表
 */
export const getCities = async () => {
  try {
    const airports = await loadAirports();
    const cities = [...new Set(airports.map(airport => airport.municipality))];
    return cities.sort();
  } catch (error) {
    console.error('获取城市列表失败:', error);
    return [];
  }
};

export default { loadAirports, getAirportByCode, getAirportMap, getCities };