/**
 * 流程设计
 */
import React, { Component, Fragment } from 'react';
import { Modal, Row, Button, message } from 'antd';
import { GUID, clone, getByteLen } from 'utils/utils';
import './ProcessConf.less';
import addImg from 'assets/Addfile.png';
import lianjie from 'assets/lianjie.png';
import lianjie2 from 'assets/lianjie2.png';
import shanchu from 'assets/shanchu.png';
import fangda from 'assets/fangda.png';
import shuoxiao from 'assets/suoxiao.png';
import edit from 'assets/edit.png';
import edit1 from 'assets/edit1.png';
import NodeConf from './NodeConf';
import PathConf from './PathConf';
let viewW = 1200;
let viewH = parseInt(document.body.clientHeight * 0.8);
const singleRectW = 150; // width
const singleRectH = 30; // 一半height
const endR = 30;
export default class ProcessConf extends Component {
  state = {
    datas: {
      nodes: [
        { id: 'start', x: 1200 / 2 - singleRectW / 2, y: 10, title: '开始' },
        { id: 'end', x: 1200 / 2, y: viewH - 50, title: '结束' },
      ],
      lines: [{ source: 'start', target: 'end', id: new GUID().newGUID() }],
    },
    viewScale: 1,
    nodeVisible: false,
    pathVisible: false,
    // chartDetail: [],// 总数据列表
    curEditNode: {}, // 当前编辑的node
    curEditLine: {}, // 当前编辑的线
  };
  isClickRect = false; // 是否点击的rect
  isClickCircle = false; //是否点击结束
  clickRectItem = ''; // 当前点击的元素
  mouseInEl = {};
  isClickContent = false; // 是否点击外框（获取是否移动）
  posMouseDown = null;
  oldNodes = null;
  clickNode = false;
  componentDidMount() {
    setTimeout(this.addEventListener, 1000);
    let _chartDetail = this.props.bpmDesign.chartDetail;
    if (_chartDetail.length !== 0) {
      let _nodes = [];
      let _lines = [];
      let _startId = '';
      let _endId = '';
      let allLines = [];
      // 数据处理
      _chartDetail.forEach(item => {
        if (item.activityType === 0) {
          _startId = item.activityGUID;
        } else if (item.activityType === 4) {
          _endId = item.activityGUID;
        }
        _nodes.push({
          id:
            item.activityType === 0 || item.activityType === 4
              ? item.activityType === 0
                ? 'start'
                : 'end'
              : item.activityGUID,
          x: +item.centerPoint.split(',')[0],
          y: +item.centerPoint.split(',')[1],
          title: item.name,
          activityType: item.activityType,
          description: item.description,
          participants: item.participants,
        });
        allLines = allLines.concat(item.paths);
      });
      allLines.forEach(it => {
        let _conditions = [];
        it.conditions.forEach(conItem => {
          _conditions = JSON.parse(
            conItem['Holder.BPM.Extends.FormFieldCondition, Holder.BPM.Extends']
          ).FieldConditions;
        });
        // 格式化Number
        _conditions && _conditions.forEach((item, index)=>{
          item.Number = index+1;
        })
        _lines.push({
          source:
            it.activityDefineGUID === _startId
              ? 'start'
              : it.activityDefineGUID === _endId
                ? 'end'
                : it.activityDefineGUID,
          target:
            it.targetActivityGUID === _endId
              ? 'end'
              : it.targetActivityGUID === _startId
                ? 'start'
                : it.targetActivityGUID,
          id: it.pathDefineGUID,
          name: it.name,
          description: it.description,
          conditions: _conditions,
        });
      });
      this.setState({
        datas: {
          nodes: _nodes,
          lines: _lines,
        },
      });
    }
  }
  componentWillUnmount() {
    this.removeEventListener();
  }
  removeEventListener = () => {
    // 销毁监听事件
    window.removeEventListener('resize', this.viewChange);
    window.removeEventListener('mousedown', this.windowDown);
    window.removeEventListener('mouseup', this.windowUp);
    window.removeEventListener('mousemove', this.windowMove);
    let els = document.querySelectorAll('.rectGraph');
    for (let item of els) {
      item.removeEventListener('mousedown', this.rectDown);
      item.removeEventListener('mouseup', this.rectUp);
    }
    let endDom = document.querySelector('#end');
    endDom.removeEventListener('mousedown', this.endDown);
  };
  addEventListener = () => {
    // 清除之前的
    this.removeEventListener();
    window.addEventListener('resize', this.viewChange);
    // 监听方框的点击事件
    let els = document.querySelectorAll('.rectGraph');
    for (let item of els) {
      item.addEventListener('mousedown', this.rectDown);
      item.addEventListener('mouseup', this.rectUp);
    }
    document.querySelector('#processContainer').addEventListener('mousedown', this.windowDown);
    window.addEventListener('mouseup', this.windowUp);
    window.addEventListener('mousemove', this.windowMove);
    let endDom = document.querySelector('#end');
    endDom.addEventListener('mousedown', this.endDown);
  };
  endDown = e => {
    let endDom = document.querySelector('#end');
    e.stopPropagation();
    this.isClickCircle = true;
    this.mouseInEl = {
      x: e.offsetX - endDom.getAttribute('x'),
      y: e.offsetY - endDom.getAttribute('y'),
    };
  };
  viewChange = () => {
    console.log('***');
    viewH = parseInt(document.body.clientHeight * 0.8);
    this.setState({});
  };
  windowMove = e => {
    const { nodes, lines } = this.state.datas;
    let cloneLines = clone(lines);
    const { viewScale } = this.state;
    let _viewW = viewScale < 1 ? viewW / viewScale : viewW;
    let _viewH = viewScale < 1 ? viewH / viewScale : viewH;
    // 单选移动
    if (this.isClickRect) {
      let cloneNodes = clone(nodes);

      let _curId = this.clickRectItem.getAttribute('id');
      cloneNodes.forEach(it => {
        if (it.id === _curId) {
          let _x = e.offsetX - this.mouseInEl.x;
          let _y = e.offsetY - this.mouseInEl.y;
          it.x = _x < 0 ? 0 : _x > _viewW - singleRectW ? _viewW - singleRectW : _x;
          it.y = _y < 0 ? 0 : _y > _viewH - 60 ? _viewH - 60 : _y;
        }
      });
      this.setState({
        datas: {
          nodes: cloneNodes,
          lines: lines,
        },
      });
    } else if (this.isClickContent) {
      // 多选移动
      let cloneNodes = clone(nodes);
      let diffX = e.clientX - this.posMouseDown.clientX;
      let diffY = e.clientY - this.posMouseDown.clientY;
      // 判断是否所有节点出边界
      let isBorderIn = false;
      // 移动
      for (let i = 0; i < cloneNodes.length; i++) {
        let it = cloneNodes[i];
        if (it.id === 'end') {
          let _x = this.oldNodes[i].x + diffX;
          let _y = this.oldNodes[i].y + diffY;
          // 是否有节点没有超出画布
          if (!(_x < endR || _x > _viewW - endR || _y < endR || _y > _viewH - endR)) {
            isBorderIn = true;
          }
          it.x = _x;
          it.y = _y;
        } else {
          let _x = this.oldNodes[i].x + diffX;
          let _y = this.oldNodes[i].y + diffY;
          // 是否有节点没有超出画布
          if (!(_x < 0 || _x > _viewW - singleRectW || _y < 0 || _y > _viewH - 60)) {
            isBorderIn = true;
          }
          it.x = _x;
          it.y = _y;
        }
      }
      if (!isBorderIn) {
        return;
      }
      this.setState({
        datas: {
          nodes: cloneNodes,
          lines: lines,
        },
      });
    } else if (this.isClickCircle) {
      // 移动结束按钮
      let cloneNodes = clone(nodes);
      cloneNodes.forEach(it => {
        if (it.id === 'end') {
          let _x = e.offsetX - this.mouseInEl.x;
          let _y = e.offsetY - this.mouseInEl.y;
          console.log(e.offsetX, this.mouseInEl.x, endR, '---');
          it.x = _x < endR ? endR : _x > _viewW - endR ? _viewW - endR : _x;
          it.y = _y < endR ? endR : _y > _viewH - endR ? _viewH - endR : _y;
        }
      });
      this.setState({
        datas: {
          nodes: cloneNodes,
          lines: lines,
        },
      });
    } else if (nodes.some(item => item.linkStatus)) {
      // 点击链接之后移动带线
      for (let item of cloneLines) {
        if (typeof item.target === 'object') {
          item.target = { x: e.offsetX, y: e.offsetY };
          this.setState({
            datas: {
              nodes: nodes,
              lines: cloneLines,
            },
          });
          break;
        }
      }
    }
  };
  windowUp = e => {
    const { nodes, lines } = this.state.datas;
    const { viewScale } = this.state;
    this.isClickRect = false;
    this.mouseInEl = {};
    this.isClickContent = false;
    // 添加线，移动之后点击确认
    if (nodes.some(item => item.linkStatus)) {
      let _node = clone(nodes);
      let _lines = clone(lines);
      let hasRect = false;
      for (let item of _node) {
        if (!item.linkStatus) {
          let clickRect = false;
          if (item.id === 'end') {
            clickRect =
              e.offsetX >= item.x - endR &&
              e.offsetY >= item.y - endR &&
              e.offsetX <= item.x + endR * 2 * viewScale &&
              e.offsetY <= item.y + endR * 2 * viewScale;
          } else {
            clickRect =
              e.offsetX >= item.x &&
              e.offsetY >= item.y &&
              e.offsetX <= item.x + singleRectW * viewScale &&
              e.offsetY <= item.y + singleRectH * 2 * viewScale;
          }
          if (clickRect) {
            hasRect = true;
            for (let it of _lines) {
              // 判断是否有重复的线
              if (typeof it.target === 'string') {
                // 判断起点和终点都不能互相重复
                if (
                  (_node.find(i => i.linkStatus).id === it.source && it.target === item.id) ||
                  (_node.find(i => i.linkStatus).id === it.target && it.source === item.id)
                ) {
                  _lines.forEach(
                    (lineItem, index) =>
                      typeof lineItem.target === 'object' && (_lines[index] = undefined)
                  );
                  _node.find(i => i.linkStatus).linkStatus = false;
                  break;
                }
              } else {
                it.target = item.id;
                _node.find(i => i.linkStatus).linkStatus = false;
                break;
              }
            }
            break;
          }
        }
      }
      // 点击时没有节点，删除线
      if (!hasRect) {
        _lines.forEach((it, index) => {
          if (typeof it.target === 'object') {
            _lines[index] = undefined;
            _node.find(i => i.linkStatus).linkStatus = false;
          }
        });
      }
      // 过滤为undefined的线
      _lines = _lines.filter(item => item);
      this.setState({
        datas: {
          nodes: _node,
          lines: _lines,
        },
      });
    }
    // 结束
    if (this.isClickCircle) {
      this.isClickCircle = false;
      this.mouseInEl = {};
    }
  };
  windowDown = e => {
    this.isClickContent = true;
    this.mouseInEl = {
      x: e.clientX,
      y: e.offsetY,
    };
    this.posMouseDown = e;
    const { nodes, lines } = this.state.datas;
    this.oldNodes = clone(nodes);
    // 关闭右侧
    if (this.state.nodeVisible) {
      nodes.forEach(item => (item.edit = false));
      this.setState({
        nodeVisible: false,
        curEditNode: {},
      });
    } else if (this.state.pathVisible) {
      lines.forEach(item => {
        item.hover = false;
        item.edit = false;
      });
      this.setState({
        pathVisible: false,
        curEditPath: {},
      });
    }
  };
  rectDown = e => {
    e.stopPropagation();
    this.isClickRect = true;
    this.clickRectItem = e.target.parentNode;
    this.mouseInEl = {
      x: e.offsetX - this.clickRectItem.getAttribute('x'),
      y: e.offsetY - this.clickRectItem.getAttribute('y'),
    };
  };
  rectUp = e => {
    // e.stopPropagation()
    // 回复到初始状态
    if (this.isClickRect) {
      this.isClickRect = false;
      this.mouseInEl = {};
      this.clickRectItem = '';
    }
  };
  newPath = sourceNode => {
    const { nodes, lines } = this.state.datas;
    const { viewScale } = this.state;
    let sourceX = +sourceNode.getAttribute('x');
    let sourceY = +sourceNode.getAttribute('y');
    let sourceId = sourceNode.getAttribute('id');
    let targetId = new GUID().newGUID();
    // 该source下面的子节点，布局---
    let child = lines.filter(item => item.source === sourceId);
    let _nodes = clone(nodes) || [];
    let index = 0;
    if (child.length > 0) {
      let isAssign = { left: true, value: sourceX };
      // 判断该点有没有节点
      let getNodePos = (item, x, y) => {
        if (nodes.some(it => it.id === item.target && it.x === x && it.y === y)) {
          if (isAssign.left) {
            index += 1;
            let _value = x - 200 * index;
            isAssign = { left: false, value: _value };
          } else {
            index += 1;
            let _value = x + 200 * index;
            isAssign = { left: true, value: _value };
          }
        }
      };
      child.forEach(item => {
        // 第一次查找坐标
        if (isAssign.value === sourceX) {
          getNodePos(item, sourceX, sourceY + 150);
        } else {
          getNodePos(item, isAssign.value, sourceY + 150);
        }
      });
      _nodes.push({ id: targetId, x: isAssign.value, y: sourceY + 150, title: '' });
    } else {
      _nodes.push({ id: targetId, x: sourceX, y: sourceY + 150, title: '' });
    }
    this.setState(
      {
        datas: {
          nodes: _nodes,
          lines: [
            ...lines,
            { source: sourceNode.getAttribute('id'), target: targetId, id: new GUID().newGUID() },
          ],
        },
      },
      () => {
        this.addEventListener();
      }
    );
  };
  getLinePoint = (source, target) => {
    // const { viewScale } = this.state;
    const viewScale = 1;
    //根据2个节点获取连线
    if (source === undefined || target === undefined) {
      console.warn('节点为空source,target', source, target);
    }
    if (
      source.x === undefined ||
      source.y === undefined ||
      target.x === undefined ||
      target.y === undefined
    ) {
      console.warn('连线节点坐标为空[source,target]');
    }
    var sourceRX = (singleRectW * viewScale) / 2 + 1; //source 节点 x轴半径
    var sourceRY = (singleRectH * 2 * viewScale) / 2 + 1; //source 节点 y轴半径
    var sourceCenterX = source.x + sourceRX; // source 中心点 x
    var sourceCenterY = source.y + sourceRY; // source 中心点 y

    var targetRX = target.id === 'end' ? viewScale * endR + 1 : (singleRectW * viewScale) / 2 + 1; //target 节点 x轴半径
    var targetRY =
      target.id === 'end' ? viewScale * endR + 1 : (singleRectH * 2 * viewScale) / 2 + 1; //target 节点 y轴半径
    var targetCenterX = target.id === 'end' ? target.x : target.x + targetRX; // target 中心点 x
    var targetCenterY = target.id === 'end' ? target.y : target.y + targetRY; // target 中心点 y

    var v = {
      x: targetCenterX - sourceCenterX, // 向量x
      y: targetCenterY - sourceCenterY, // 向量y
      x1: sourceCenterX - targetCenterX, // 向量x
      y1: sourceCenterY - targetCenterY, // 向量y
    };
    v.dis = Math.sqrt(v.x * v.x + v.y * v.y); // 2点距离
    //默认矩形节点
    var x = sourceCenterX + (v.x > 0 ? sourceRX : -sourceRX);
    var y = sourceCenterY + (sourceRX / Math.abs(v.x)) * v.y;
    if (y < source.y || y > source.y + singleRectH * 2 * viewScale) {
      y = sourceCenterY + (v.y > 0 ? sourceRY : -sourceRY);
      x = sourceCenterX + (sourceRY / Math.abs(v.y)) * v.x;
    }
    //默认矩形节点
    var x1 = targetCenterX + (v.x1 > 0 ? targetRX : -targetRX);
    var y1 = targetCenterY + (targetRX / Math.abs(v.x1)) * v.y1;
    if (y1 < target.y || y1 > target.y + singleRectH * 2 * viewScale) {
      y1 = targetCenterY + (v.y1 > 0 ? targetRY : -targetRY);
      x1 = targetCenterX + (targetRY / Math.abs(v.y1)) * v.x1;
    }
    if (target.id === 'end') {
      //圆形节点Y
      x1 = targetCenterX + (targetRX / v.dis) * v.x1;
      y1 = targetCenterY + (targetRY / v.dis) * v.y1;
    }
    return {
      x: Math.floor(x),
      y: Math.floor(y),
      x1: Math.floor(x1),
      y1: Math.floor(y1),
    };
  };
  maxFun = () => {
    const { viewScale } = this.state;
    // 最大放到3倍
    this.setState({
      viewScale: viewScale + 0.2 > 3 ? 3 : viewScale + 0.2,
    });
  };
  minFun = () => {
    const { viewScale } = this.state;
    // 最小0.2倍
    this.setState({
      viewScale: viewScale - 0.2 < 0.2 ? 0.2 : viewScale - 0.2,
    });
  };
  // 打开节点配置
  openNode = item => {
    const { nodes, lines } = this.state.datas;
    nodes.forEach(item => (item.edit = false));
    lines.forEach(item => (item.edit = false));
    item.edit = true;
    if (this.state.nodeVisible && item != this.state.curEditNode) {
      console.log(this.state.nodeVisible, item, this.state.curEditNode);
      this.setState(
        {
          nodeVisible: false,
        },
        () => {
          this.setState({
            nodeVisible: true,
            pathVisible: false,
            curEditNode: item,
          });
        }
      );
      return;
    }
    this.setState({
      nodeVisible: true,
      pathVisible: false,
      curEditNode: item,
    });
  };
  // 打开路径配置
  openPath = (index, e) => {
    e.stopPropagation();
    const { nodes, lines } = this.state.datas;
    nodes.forEach(item => (item.edit = false));
    lines.forEach(item => (item.edit = false));
    let _lines = clone(lines);
    _lines[index].edit = true;
    this.setState({
      pathVisible: true,
      nodeVisible: false,
      curEditLine: _lines[index],
      datas: {
        nodes: nodes,
        lines: _lines.filter(item => item),
      },
    });
  };
  // 删除节点
  delRect = (id, e) => {
    e.stopPropagation();
    const { nodes, lines } = this.state.datas;
    let _nodes = clone(nodes);
    let _lines = clone(lines);
    for (let index in _nodes) {
      if (_nodes[index].id === id) {
        _nodes[index] = undefined;
        break;
      }
    }
    _lines.forEach((item, index) => {
      if (item.source === id || item.target === id) {
        _lines[index] = undefined;
      }
    });
    this.setState({
      datas: {
        nodes: _nodes.filter(item => item),
        lines: _lines.filter(item => item),
      },
    });
  };
  // 增加线
  addLink = (id, { x, y }) => {
    const { nodes, lines } = this.state.datas;
    let _nodes = clone(nodes);
    let _lines = clone(lines);
    _lines.push({ source: id, target: { x: x, y: y }, id: new GUID().newGUID() });
    _nodes.forEach(item => item.id === id && (item.linkStatus = !item.linkStatus));
    this.setState({
      datas: {
        nodes: _nodes,
        lines: _lines,
      },
    });
  };
  // 删除线
  delLink = index => {
    const { nodes, lines } = this.state.datas;
    let _lines = clone(lines);
    _lines[index] = undefined;
    this.setState({
      datas: {
        nodes: nodes,
        lines: _lines.filter(item => item),
      },
    });
  };
  // 指线
  hoverLine = index => {
    const { nodes, lines } = this.state.datas;
    let _lines = clone(lines);
    _lines.forEach((it, ind) => {
      if (ind === index) {
        it.hover = true;
      } else {
        it.hover = false;
      }
    });
    this.setState({ datas: { lines: _lines, nodes: nodes } });
  };
  // 离开
  leaveLine = () => {
    const { nodes, lines } = this.state.datas;
    let _lines = clone(lines);
    _lines.forEach((it, ind) => {
      it.hover = false;
    });
    this.setState({ datas: { lines: _lines, nodes: nodes } });
  };
  // nodes修改右侧菜单的回调
  changeNodeMenu = _item => {
    const { nodes, lines } = this.state.datas;
    let _nodes = clone(nodes);
    _nodes.forEach((item, index) => {
      if (_item.id === item.id) {
        _nodes[index] = _item;
      }
    });
    this.setState({
      curEditNode: _item,
      datas: {
        lines,
        nodes: _nodes,
      },
    });
  };
  // lines修改右侧菜单的回调
  changeLineMenu = _item => {
    const { nodes, lines } = this.state.datas;
    let _lines = clone(lines);
    _lines.forEach((item, index) => {
      if (_item.id === item.id) {
        _lines[index] = _item;
      }
    });
    this.setState({
      curEditLine: _item,
      datas: {
        lines: _lines,
        nodes,
      },
    });
  };
  // 提交数据
  submitData = () => {
    const { dispatch, editData, onOk } = this.props;
    const { nodes, lines } = this.state.datas;
    let datas = [];
    let _startId = new GUID().newGUID();
    let _endId = new GUID().newGUID();
    let isError = false;
    let targets = [];
    nodes.forEach(item => {
      let _path = lines.map(it => {
        // 名称不能为空
        // if (!it.name) {
        //     message.destroy();
        //     message.warning('路径名称不能为空!');
        //     isError = true;
        // }
        if (it.source === item.id) {
          targets.push(it.target);
          return {
            pathDefineGUID: it.id,
            activityDefineGUID:
              it.source === 'start' ? _startId : it.source === 'end' ? _endId : it.source,
            workflowDefineID: editData.id,
            workflowDefineVersion: editData.version,
            name: it.name || '',
            description: it.description,
            targetActivityGUID:
              it.target === 'end' ? _endId : it.target === 'start' ? _startId : it.target,
            conditions: [
              {
                //it.conditions || []
                'Holder.BPM.Extends.FormFieldCondition, Holder.BPM.Extends': JSON.stringify({
                  Name: '',
                  Description: '',
                  FieldConditions: it.conditions,
                }),
              },
            ],
          };
        }
      });
      _path = _path.filter(it => it);
      // 无子节点判断为不通过
      if (item.id !== 'end' && _path.length === 0) {
        message.destroy();
        message.warning('流程未完善!');
        isError = true;
      }
      // 名称不能为空
      if (!item.title) {
        message.destroy();
        message.warning('节点名称不能为空!');
        isError = true;
      }
      // 节点角色不能为空
      if (item.id !== 'start' && item.id !== 'end') {
        if (!item.participants || item.participants.length === 0) {
          message.destroy();
          message.warning('参与者不能为空!');
          isError = true;
        }
      }
      datas.push({
        activityGUID: item.id === 'start' ? _startId : item.id === 'end' ? _endId : item.id,
        workflowDefineID: editData.id,
        workflowDefineVersion: editData.version,
        name: item.title,
        description: item.description,
        activityType: item.id === 'start' ? 0 : item.id === 'end' ? 4 : 1,
        centerPoint: `${item.x},${item.y}`,
        participants: item.participants
          ? item.participants.map(partItem => {
              return {
                participantGUID: new GUID().newGUID(),
                activityDefineGUID:
                  item.id === 'start' ? _startId : item.id === 'end' ? _endId : item.id,
                workflowDefineID: editData.id,
                workflowDefineVersion: editData.version,
                constraints: [],
                rangeType: 2,
                rangeValue: partItem.rangeValue,
                rangeText: partItem.rangeText,
              };
            })
          : [],
        paths: _path,
      });
    });
    // 判断是否有节点指向end
    if (!targets.some(item => item === 'end')) {
      message.destroy();
      message.warning('流程未完善!');
      isError = true;
    }
    if (isError) {
      return;
    }
    dispatch({
      type: 'bpmDesign/changeBpmChartDetail',
      payload: {
        id: editData.id,
        version: editData.version,
        param: datas,
      },
    }).then(res => {
      if (res) {
        message.destroy();
        message.success('提交成功！');
        onOk();
      } else {
        message.destroy();
        message.warning('提交失败！');
      }
    });
  };
  render() {
    const { visible, onCancel } = this.props;
    const { viewScale, curEditNode, curEditLine } = this.state;
    const { nodes, lines } = this.state.datas;
    const footer = (
      <Row>
        <Button
          onClick={() => {
            onCancel();
          }}
        >
          取消
        </Button>
        <Button type="primary" onClick={this.submitData}>
          提交
        </Button>
      </Row>
    );
    return (
      <Modal
        title="流程设计"
        maskClosable={false}
        footer={footer}
        wrapClassName="processModal"
        centered={true}
        visible={visible}
        bodyStyle={{
          padding: 0,
          overflow: 'auto',
          height: parseInt(document.body.clientHeight * 0.8) + 'px',
          maxHeight: parseInt(document.body.clientHeight * 0.8) + 'px',
        }}
        onCancel={onCancel}
        width={1200}
      >
        <div id="processContainer" style={{ height: viewH + 'px', width: viewW + 'px' }}>
          <svg
            width={viewScale <= 1 ? viewW : viewW * viewScale}
            height={viewScale <= 1 ? viewH : viewH * viewScale}
            ondragstart="return false;"
            style={{ overflow: 'hidden' }}
          >
            <g x="0" y="0" id="graphContent" transform={`scale(${viewScale},${viewScale})`}>
              <defs>
                <linearGradient id="topRect" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#3C4D5F" />
                  <stop offset="100%" stop-color="#818AA5" />
                </linearGradient>
              </defs>
              <defs>
                <linearGradient id="otherRect" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#FFC248" />
                  <stop offset="100%" stop-color="#FF7205" />
                </linearGradient>
              </defs>
              <defs>
                <linearGradient id="endCircle" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#8C8C8C" />
                  <stop offset="100%" stop-color="#D5D5D5" />
                </linearGradient>
              </defs>
              <defs>
                <marker
                  id="arrowLeft"
                  markerWidth="8"
                  markerHeight="8"
                  orient="auto"
                  viewBox="-1 -3 6 6"
                >
                  <path d="M-1,0 L5,-3 L5,3 Z"> </path>
                </marker>
                <marker
                  id="arrowRight"
                  markerWidth="8"
                  markerHeight="8"
                  orient="auto"
                  viewBox="-5 -3 6 6"
                >
                  <path d="M-5,-3 L1,0 L-5,3 Z"> </path>
                </marker>
              </defs>
              {lines.map((it, index) => {
                let _source = nodes.find(item => item.id === it.source);
                let _target;
                if (typeof it.target === 'string') {
                  _target = nodes.find(item => item.id === it.target);
                } else {
                  _target = it.target;
                }
                let linePos = this.getLinePoint(_source, _target);
                if (typeof it.target === 'object') {
                  linePos.x1 = it.target.x;
                  linePos.y1 = it.target.y;
                }
                return (
                  <Fragment>
                    <path
                      d={`M${linePos.x} ${linePos.y} L${linePos.x1} ${linePos.y1}`}
                      class="graph-line"
                      marker-end="url(#arrowRight)"
                    />
                    {it.hover ? (
                      <g
                        transform={`translate(${(linePos.x + linePos.x1) / 2 - 18}, ${(linePos.y +
                          linePos.y1) /
                          2 -
                          16})`}
                        onMouseLeave={() => {
                          if (!it.edit) {
                            this.leaveLine();
                          }
                        }}
                      >
                        <rect width={36} height={16} x={0} y={0} fill="#fff" />
                        <image
                          x={-5}
                          y={0}
                          xlinkHref={shanchu}
                          style={{ cursor: 'pointer' }}
                          onClick={e => {
                            this.delLink(index, e);
                          }}
                        />
                        <image
                          x={25}
                          y={0}
                          xlinkHref={it.edit ? edit1 : edit}
                          style={{ cursor: 'pointer' }}
                          onClick={e => {
                            this.openPath(index, e);
                          }}
                        />
                      </g>
                    ) : (
                      <text
                        id={`${it.source}text${it.target}`}
                        x={
                          (linePos.x + linePos.x1) / 2 -
                          (14 * getByteLen(it.name || '配置路径')) / 4
                        }
                        y={(linePos.y + linePos.y1) / 2}
                        onMouseEnter={() => {
                          this.hoverLine(index);
                        }}
                        style={{ cursor: 'pointer' }}
                        fill="#333333"
                      >
                        {it.name || '配置路径'}
                      </text>
                    )}
                  </Fragment>
                );
              })}
              {nodes.map(item => {
                return item.id !== 'end' ? (
                  <g
                    id={item.id}
                    className="rectGraph"
                    x={item.x}
                    y={item.y}
                    transform={`translate(${item.x}, ${item.y})`}
                  >
                    <rect
                      width={singleRectW}
                      height={singleRectH + 5}
                      x="0"
                      y="0"
                      fill={item.id === 'start' ? 'url(#topRect)' : 'url(#otherRect)'}
                      rx="5"
                    />
                    <text
                      x={singleRectW / 2 - (getByteLen(item.title) * 14) / 4}
                      y={20}
                      fill="#fff"
                    >
                      {item.title || ''}
                    </text>
                    <rect
                      width={singleRectW}
                      height={singleRectH}
                      x="0"
                      y={singleRectH}
                      fill="#fff"
                      stroke="#d6d6d6"
                    />
                    <image
                      id="add"
                      x="10"
                      y="35"
                      onClick={e => {
                        e.stopPropagation();
                        this.newPath(e.target.parentNode);
                      }}
                      style={{ cursor: 'pointer' }}
                      xlinkHref={addImg}
                    />
                    <image
                      id="lianjie"
                      x="36"
                      y="35"
                      style={{ cursor: 'pointer' }}
                      onClick={e => {
                        e.stopPropagation();
                        this.addLink(item.id, { x: item.x + 36, y: item.y + 35 });
                      }}
                      xlinkHref={item.linkStatus ? lianjie2 : lianjie}
                    />
                    {item.id !== 'start' && (
                      <image
                        id="shanchu"
                        x="62"
                        y="35"
                        onClick={e => {
                          this.delRect(item.id, e);
                        }}
                        style={{ cursor: 'pointer' }}
                        xlinkHref={shanchu}
                      />
                    )}
                    {item.id !== 'start' && (
                      <image
                        id="edit"
                        x={item.id === 'start' ? '62' : '88'}
                        y="35"
                        xlinkHref={item.edit ? edit1 : edit}
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          this.openNode(item);
                        }}
                      />
                    )}
                  </g>
                ) : (
                  <g id="end" x={item.x} y={item.y} transform={`translate(${item.x}, ${item.y})`}>
                    <circle cx="0" cy="0" r={endR} fill="url(#endCircle)" />
                    <text x={-15} y={5} fill="#fff">
                      结束
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
          {this.state.nodeVisible && (
            <NodeConf
              {...this.props}
              curEditNode={curEditNode}
              changeNodeMenu={this.changeNodeMenu}
              visible={this.state.nodeVisible}
              onCancel={() => {
                nodes.forEach(item => (item.edit = false));
                this.setState({ nodeVisible: false, curEditNode: {} });
              }}
            />
          )}
          {this.state.pathVisible && (
            <PathConf
              {...this.props}
              curEditLine={curEditLine}
              changeLineMenu={this.changeLineMenu}
              visible={this.state.pathVisible}
              onCancel={() => {
                lines.forEach(item => {
                  item.hover = false;
                  item.edit = false;
                });
                this.setState({ pathVisible: false, curEditLine: {} });
              }}
            />
          )}
        </div>
        <div id="imgContiner">
          <span style={{ marginRight: '10px' }}>{parseInt(viewScale * 100) + '%'}</span>
          <img
            id="fangda"
            onClick={this.maxFun}
            width="24"
            height="24"
            style={{ cursor: 'pointer' }}
            src={fangda}
          />
          <img
            id="shuoxiao"
            onClick={this.minFun}
            width="24"
            height="24"
            style={{ cursor: 'pointer', marginLeft: '10px' }}
            src={shuoxiao}
          />
        </div>
      </Modal>
    );
  }
}
