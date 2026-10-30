import test from 'node:test';
import assert from 'node:assert/strict';
import { ShapeFactory } from '../src/domain/ShapeFactory.js';
import { SvgDocument } from '../src/domain/SvgDocument.js';
const factory = new ShapeFactory();
test('six polymorphic shapes move, scale and clone without type dispatch', () => {
  const cases: [string,string[],Record<string,string>][] = [
    ['rect',['1','2','3','4'],{x:'4',y:'8',width:'6',height:'8'}],
    ['circle',['1','2','3'],{cx:'4',cy:'8',r:'6'}],
    ['ellipse',['1','2','3','4'],{cx:'4',cy:'8',rx:'6',ry:'8'}],
    ['line',['1','2','3','4'],{x1:'4',y1:'8',x2:'8',y2:'12'}],
    ['text',['1','2','Hello world'],{x:'4',y:'8'}],
    ['g',[],{}]
  ];
  for (const [type,args,expected] of cases) {
    const shape = factory.create(type,'s',args); const copy = shape.clone();
    shape.move(1,2); shape.scale(2);
    for (const [key,value] of Object.entries(expected)) assert.equal(shape.attributes()[key],value);
    assert.deepEqual(copy.toElement(),factory.create(type,'s',args).toElement());
  }
});
test('groups support nested geometry and independent snapshots', () => {
  const doc = new SvgDocument(); doc.add(factory.create('g','scene',[])); doc.add(factory.create('g','node',[]),'scene'); doc.add(factory.create('rect','r',['1','2','3','4']),'node');
  const snapshot = doc.clone(); doc.move('scene',3,4); doc.scale('scene',2);
  assert.equal(doc.find('r').attributes().x,'8'); assert.equal(snapshot.find('r').attributes().x,'1');
  doc.set('node','fill','red'); assert.equal(doc.find('node').attributes().fill,'red');
  doc.ungroup('node'); assert.match(doc.show('r'),/parent=g#scene/);
  assert.throws(() => doc.ungroup('scene'),/cannot ungroup top-level container/);
});
test('group preserves document order, rejects ancestor selection and cycles', () => {
  const doc = new SvgDocument(); for (const id of ['a','b','c']) doc.add(factory.create('rect',id,['0','0','1','1']));
  doc.group('g',['c','a']); assert.deepEqual(doc.find('g').children().map(s => s.id),['a','c']);
  assert.throws(() => doc.group('bad',['a','g']),/cannot group a container into its own descendant: g/);
  doc.add(factory.create('g','inner',[]),'g'); assert.throws(() => doc.addTo('inner','g'),/own descendant/);
  doc.reorder('b',false); assert.deepEqual(doc.toElement().children.map(s => s.attributes.id),['b','g']);
});
test('validation rejects duplicate ids, invalid geometry and attributes', () => {
  const doc = new SvgDocument(); doc.add(factory.create('rect','r',['0','0','1','1']));
  assert.throws(() => doc.add(factory.create('g','r',[])),/id already exists: r/);
  assert.throws(() => doc.set('r','id','new'),/unknown attribute: id/);
  assert.throws(() => doc.scale('r',0),/scale factor must be positive/);
  assert.throws(() => factory.create('box','b',[]),/unknown shape type: box/);
  assert.throws(() => factory.create('circle','c',['0','0','-1']),/nonnegative/);
  assert.throws(() => factory.create('rect','r',['NaN','0','1','1']),/invalid number/);
});
