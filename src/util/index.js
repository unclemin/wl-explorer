/**
 * 防抖函数
 * @param {*} func 防抖后要执行的回调
 * @param {*} wait 等待时间
 * @param {*} immediate 
 */
function debounce(func, wait, immediate) {
  let timeout, args, context, timestamp, result;

  const later = function() {
    // 据上一次触发时间间隔
    const last = +new Date() - timestamp;

    // 上次被包装函数被调用时间间隔last小于设定时间间隔wait
    if (last < wait && last > 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      // 如果设定为immediate===true，因为开始边界已经调用过了此处无需调用
      if (!immediate) {
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      }
    }
  };

  return function(...args) {
    context = this;
    timestamp = +new Date();
    const callNow = immediate && !timeout;
    // 如果延时不存在，重新设定延时
    if (!timeout) timeout = setTimeout(later, wait);
    if (callNow) {
      result = func.apply(context, args);
      context = args = null;
    }

    return result;
  };
}

/**
 * 将数组转化成树结构 array to tree
 * @param {*} array 数据源
 * @param {*} options 字段名配置项
 */
function arrayToTree(
  array = [],
  options = { id: "id", pid: "pid", children: "children" },
) {
  let array_ = []; // 创建储存剔除叶子节点后的骨架节点数组
  let unique = {}; // 创建盒子辅助本轮children合并去重
  let root_pid = [
    0,
    "0",
    undefined,
    "undefined",
    null,
    "null",
    "00000000-0000-0000-0000-000000000000"
  ]; // 可能存在的根节点pid形式
  array.forEach(item => {
    // 筛选可以插入当前节点的所有子节点
    let children_array = array.filter(
      it => it[options.pid] === item[options.id]
    );
    if (item[options.children] && item[options.children] instanceof Array && item[options.children].length > 0) {
      // 去重合并数组
      item[options.children].map(i => (unique[i[options.id]] = 1));
      item[options.children].push(
        ...children_array.filter(i => unique[i[options.id]] !== 1)
      );
    } else {
      item[options.children] = children_array;
    }
    // 当children_array有数据时插入下一轮array_，当无数据时将最后留下来的根节点树形插入数组
    let has_children = children_array.length > 0;
    if (
      has_children ||
      (!has_children && root_pid.includes(item[options.pid]))
    ) {
      array_.push(item);
    }
  });
  // 当数组内仅有根节点时退出，否组继续处理 最终递归深度次
  if (!array_.every(item => root_pid.includes(item[options.pid]))) {
    return arrayToTree(array_, options);
  } else {
    return array_;
  }
}

/**
 * 从坐标值拼接指定字段到祖先元素
 * @param {*} data 一维数据源
 * @param {*} coordinate 坐标值数据
 * @param {*} options 配置项
 */
function splicParentsUntil(data, coordinate, options = {
  Splic: 'Name', // 所要拼接字段
  Connector: '\\', // 连接符 
  Id: "Id", // 数据源匹配字段
  selfId: 'id', // 坐标值与数据源匹配字段
  ParentId: "ParentId",
  Parents: "Parents",
  IdentityId: "IdentityId",
  root: "00000000-0000-0000-0000-000000000000"
}) {
  let coordinate_item = data.find(i => i[options.Id] === coordinate[options.selfId]);
  if (!coordinate_item) return '';
  if (!coordinate_item[options.Parents]) return coordinate_item[options.Splic];
  let _parents = coordinate_item[options.Parents]
    .substring(1, coordinate_item[options.Parents].length - 1)
    .split(",")
    .filter(i => !!i);
  let splic_parents = '';
  _parents.forEach(i => {
    let _parent = data.find(t => t[options.IdentityId] == i);
    splic_parents += `${_parent[options.Splic]}${options.Connector}`
  })
  return splic_parents + coordinate_item[options.Splic];
}

export {
  debounce, // 防抖函数
  arrayToTree, // 将数组转化成树结构
  splicParentsUntil, // 从坐标值拼接指定字段到祖先元素
}