/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
// 引入WebSocketServer类
const { WebSocketServer } = require('ws');
const PORT = 8080;

// 创建并启动WebSocket服务器，监听PORT端口号
const wsServer = new WebSocketServer({ port: PORT }, () => {
  console.log("WebSocket服务端创建成功，地址为 ws://127.0.0.1:8080");
})

// 服务器监听connection事件，有客户端成功连接时触发
const roomIds = {}
wsServer.on("connection", (ws) => {
  // 监听消息事件
  ws.on('message', (message) => {
    const data = JSON.parse(message.toString('utf8'))
    if (data.stats === 'findCamp') {
      const msg = connectRoom(data.id);
      ws.send(JSON.stringify({ type: msg }))
    } else {
      ws.send(JSON.stringify({ msg: 111 }))
    }
    console.log('接收消息:', message.toString('utf8'));

  });

  // 监听关闭事件
  ws.on('close', (e) => {
    console.log('客户端关闭！', e);
  });

  // 监听错误事件
  ws.on('error', (error) => {
    console.log('WebSocket error:', error);
  });
})

function connectRoom(id) {
  if (roomIds[id] === undefined) {
    roomIds[id] = 0;
    return 'red'
  } else if (roomIds[id] === 0) {
    roomIds[id] = 1;
    return 'black';
  } else {
    return 'viewer'
  }
}