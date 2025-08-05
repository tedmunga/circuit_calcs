function loadConfigFromText(jsonText) {
  const config = JSON.parse(jsonText);
  return applyConfig(config);
}

function saveConfigToBlob(nodes, components) {
  const config = getConfig(nodes, components);
  const json = JSON.stringify(config, null, 2);
  return new Blob([json], { type: 'application/json' });
}

function getConfig(nodes, components) {
  return {
    nodes: nodes.map(n => ({
      x: n.x,
      y: n.y,
      isGround: n.isGround,
      nodeId: n.nodeId
    })),
    components: components.map(c => ({
      componentId: c.index,
      x: c.x,
      y: c.y,
      type: c.type,
      params: c.params,
      rotation: c.rotation,
      startNode: { nodeId: c.startNode.nodeId },
      endNode: { nodeId: c.endNode.nodeId }
    }))
  };
}


function applyConfig(config) {
  const nodeMap = new Map();
  const nodes = config.nodes.map(n => {
    const node = new Node(n.x, n.y, n.isGround, n.nodeId);
    nodeMap.set(n.nodeId, node);
    return node;
  });

  const components = config.components.map(c => {
    const startNode = nodeMap.get(c.startNode.nodeId);
    const endNode = nodeMap.get(c.endNode.nodeId);
    if (!startNode || !endNode) return null;

    const comp = new Component(c.x, c.y, c.type, c.params, startNode, endNode, c.componentId);
    comp.rotation = c.rotation;
    startNode.addConnectedNode(endNode);
    endNode.addConnectedNode(startNode);
    return comp;
  }).filter(Boolean);

  return [nodes, components];
}
