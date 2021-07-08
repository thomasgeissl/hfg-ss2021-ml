const WebSocket = require("ws");
const uuid = require("uuid");
const SerialPort = require("serialport");

const serialPath = "/dev/cu.usbmodem111201";
const wssPort = 8082;

const Readline = SerialPort.parsers.Readline;
const port = new SerialPort(serialPath);
const parser = new Readline();

const wss = new WebSocket.Server({ port: wssPort });
const connections = {};

const publishNumberOfActiveConnections = () => {
  const numberOfConnections = Object.entries(connections).length;
  const message = {
    type: "CONNECTIONEVENT",
    payload: {
      numberOfConnections,
    },
  };
  broadcast(message);
};

const broadcast = (message) => {
  for (const [key, value] of Object.entries(connections)) {
    value.send(JSON.stringify(message));
  }
};
wss.on("connection", (ws) => {
  const id = uuid.v1();
  connections[id] = ws;
  console.log("new client connected", id);
  broadcast({
    type: "NEWCLIENTCONNECTED",
    payload: {
      connectionCount: Object.entries(connections).length,
    },
  });

  ws.on("message", (message) => {
    console.log(`Received message => ${message}`, id);
    try {
      const action = JSON.parse(message);
      // TODO: do something with action, e.g. send to serial
    } catch (error) {}
  });
  ws.on("close", () => {
    delete connections[id];
    console.log("client disconnected", id);
    broadcast({
      type: "CLIENTDISCONNECTED",
      payload: {
        connectionCount: Object.entries(connections).length,
      },
    });
  });
});

const onNewSerialMessage = (data) => {
  const words = data.split(" ");
  // console.log(words[10]);
  broadcast({
    type: "TODO",
    payload: {
      // value: words
    },
  });
};

port.pipe(parser);
parser.on("data", onNewSerialMessage);
