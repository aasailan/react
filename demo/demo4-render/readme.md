# ReactDOM.render
ReactDOM.render会将react根组件挂载到页面。ReactDOM.render函数需要同时处理服务端渲染和纯客户端渲染两种逻辑，这里**只对纯客户端渲染进行探索**。希望搞清楚在**纯客户端渲染的情况下ReactDOM.render到底做了些什么**

## 函数作用
ReactDOM.render通常是React应用的入口，将react根组件挂载到页面。

## [函数签名](https://zh-hans.reactjs.org/docs/react-dom.html#render)
```
ReactDOM.render(element, container[, callback])
```
element: 需要挂载的react element对象。
container: 充当容器的dom元素
callback: render函数运行完后的回调函数

## 函数源码
### ReactDOM.render 
ReactDOM对象定义在 [./packages/react-dom/src/client/ReactDOM.js](https://github.com/aasailan/react/blob/study/packages/react-dom/src/client/ReactDOM.js)
```javascript
// demo4: ReactDOM定义
const ReactDOM: Object = {

 ...
  /**
   * @description 将指定react element对象挂载到dom
   * @param {React$Element<any>} element 需要挂载的react element
   * @param {DOMContainer} container 充当容器的dom元素
   * @param {?Function} callback 回调函数
   * @returns
   */
  render(
    element: React$Element<any>,
    container: DOMContainer,
    callback: ?Function,
  ) {
    // demo4: 核心函数legacyRenderSubtreeIntoContainer
    // 从函数名可看出该函数会将react元素的一整颗子树都渲染进dom container
    return legacyRenderSubtreeIntoContainer(
      null,
      element,
      container,
      false,
      callback,
    );
  },

  ...
};
```
发现render函数是对legacyRenderSubtreeIntoContainer函数的一层封装。继续查看legacyRenderSubtreeIntoContainer函数

### legacyRenderSubtreeIntoContainer
legacyRenderSubtreeIntoContainer任然定义在[./packages/react-dom/src/client/ReactDOM.js](https://github.com/aasailan/react/blob/study/packages/react-dom/src/client/ReactDOM.js)中。   
legacyRenderSubtreeIntoContainer函数中做了以下几件事情
1. 对dom container对象（充当容器的dom元素）进行检查，如果不符合要求则输出警告
2. 检查dom container对象是否有**_reactRootContainer**属性，有则说明dom container已经**挂载过reactElement**，否则说明dom container第一次**挂载reactElement**。然后根据判断结果采取**不同的处理方式**。这里只关注dom container第一次**挂载reactElement**的情况
3. 如果dom container没有_reactRootContainer属性，则创建**ReactRoot对象**赋值到dom container的_reactRootContainer属性
```javascript
/**
 * @description 将一整颗子树渲染进dom container
 * @param {?React$Component<any, any>} parentComponent
 * @param {ReactNodeList} children 需要挂载的react element
 * @param {DOMContainer} container 被挂载的dom container
 * @param {boolean} forceHydrate 设置为true，将客户端渲染与服务端渲染对比拟合
 * @param {?Function} callback 渲染后回调
 * @returns
 */
function legacyRenderSubtreeIntoContainer(
  parentComponent: ?React$Component<any, any>,
  children: ReactNodeList,
  container: DOMContainer,
  forceHydrate: boolean,
  callback: ?Function,
) {
  // TODO: Ensure all entry points contain this check
  // demo4: 检查container是否是dom元素，否则输出警告
  invariant(
    isValidContainer(container),
    'Target container is not a DOM element.',
  );

  if (__DEV__) {
    topLevelUpdateWarnings(container);
  }

  // demo4: 如果container从来没有挂载过reactElement，则不会有_reactRootContainer属性
  let root: Root = (container._reactRootContainer: any);
  // demo4: 根据是container是否有挂载过reactElement，选择不同渲染方式
  if (!root) {
    // Initial mount 
    // demo4: 创建ReactRoot对象，赋值到container._reactRootContainer
    root = container._reactRootContainer = legacyCreateRootFromDOMContainer(
      container,
      forceHydrate,
    );

    // demo4: 封装callback参数
    if (typeof callback === 'function') {
      const originalCallback = callback;
      callback = function() {
        // demo4: 获取根组件实例，将回调函数的this指针绑定到根组件实例
        const instance = DOMRenderer.getPublicRootInstance(root._internalRoot);
        originalCallback.call(instance);
      };
    }

    // demo4: 为什么初始化挂载不能是批量更新
    // Initial mount should not be batched.
    DOMRenderer.unbatchedUpdates(() => {
      if (parentComponent != null) {
        root.legacy_renderSubtreeIntoContainer(
          parentComponent,
          children,
          callback,
        );
      } else {
        // demo4: 首次挂载运行root.render 在这里完成整颗组件数渲染
        root.render(children, callback);
      }
    });
  } else {
    // 已经挂载过reactElement，暂不做探究
    ...
  }

  // 返回根组件实例
  return DOMRenderer.getPublicRootInstance(root._internalRoot);
}
```
上面步骤中，有两个比较关键：
1. 调用legacyCreateRootFromDOMContainer方法创建ReactRoot对象，并赋值给domContainer._reactRootContainer。**ReactRoot对象**是个非常重要的对象，内部引用着**FiberRoot对象**进而引用着Fiber树。
2. 调用ReactRoot对象的render方法，进入整个react应用的渲染

上述代码中检查dom container的函数比较简单，就是检查dom元素的nodeType。关于dom元素的nodeType的含义可[查阅MDN文档](https://developer.mozilla.org/zh-CN/docs/Web/API/Node/nodeType).
```javascript
function isValidContainer(node) {
  return !!(
    node &&
    (node.nodeType === ELEMENT_NODE ||
      node.nodeType === DOCUMENT_NODE ||
      node.nodeType === DOCUMENT_FRAGMENT_NODE ||
      (node.nodeType === COMMENT_NODE &&
        node.nodeValue === ' react-mount-point-unstable '))
  );
}
```

接下来先进入legacyCreateRootFromDOMContainer方法查看**ReactRoot对象是如何创建的**，以及**ReactRoot对象包含了什么，有什么作用**。之后再回过头来深入查看root.render的方法调用。

legacyCreateRootFromDOMContainer方法被调用时传入了dom container和forceHydrate两个参数，由于不探究服务端渲染情况forceHydrate为false。   
legacyCreateRootFromDOMContainer定义在[./packages/react-dom/src/client/ReactDOM.js](https://github.com/aasailan/react/blob/study/packages/react-dom/src/client/ReactDOM.js)中。   
该函数主要做了三件事
1. 判断是否需要采取Hydrate操作。（纯客户端渲染的情况下不需要）
2. 不需要采取Hydrate操作的情况下，清除dom container的所有子元素
3. 调用new ReactRoot创建并返回一个ReactRoot对象
```javascript
/**
 * @description 根据dom container创建ReactRoot对象
 * @param {DOMContainer} container dom container
 * @param {boolean} forceHydrate 是否采用Hydrate操作
 * @returns {Root}
 */
function legacyCreateRootFromDOMContainer(
  container: DOMContainer,
  forceHydrate: boolean,
): Root {
  // demo4: 判断是否需要 Hydrate操作，纯客户端渲染的情况为false
  const shouldHydrate =
    forceHydrate || shouldHydrateDueToLegacyHeuristic(container);

  // demo4: 不需要Hydrate操作的情况下，清除container的所有孩子节点
  if (!shouldHydrate) {
    let warned = false;
    let rootSibling;
    while ((rootSibling = container.lastChild)) {
      container.removeChild(rootSibling);
    }
  }
  // demo4: 调用new reactRoot生成ReactRoot对象，isConcurrent表示将并发设置为false
  const isConcurrent = false;
  return new ReactRoot(container, isConcurrent, shouldHydrate);
}
```
ReactRoot是一个非常关键的对象，继续查看ReactRoot类的定义

### ReactRoot类
ReactRoot任然定义在legacyCreateRootFromDOMContainer定义在[./packages/react-dom/src/client/ReactDOM.js](https://github.com/aasailan/react/blob/study/packages/react-dom/src/client/ReactDOM.js)中。    
ReactRoot类的构造函数中调用了DOMRenderer.createContainer方法生成了**FiberRoot对象**，并将该对象赋值给ReactRoot的_internalRoot属性。    
ReactRoot的原型上还定义了render、unmount、legacy_renderSubtreeIntoContainer、createBatch四个方法，其中**render方法比较重要是整个react应用开始渲染的入口**，后面会涉及。
```javascript
/**
 * @description ReactRoot类构造函数，ReactRoot对象内部引用着fiberRoot对象
 * @param {Container} container dom container
 * @param {boolean} isConcurrent 是否需要并发
 * @param {boolean} hydrate 是否需要hydrate操作
 */
function ReactRoot(
  container: Container,
  isConcurrent: boolean,
  hydrate: boolean,
) {
  // demo4: 创建fiberRoot对象放置在_internalRoot属性
  // isConcurrent被设置为false，hydrate为false
  const root = DOMRenderer.createContainer(container, isConcurrent, hydrate);
  this._internalRoot = root;
}
```
ReactRoot对象的作用主要有三个：
1. 被dom container的_reactRootContainer引用，用来判断dom container是否已经挂载过reactElement
2. ReactRoot._internalRoot引用着**FiberRoot对象，FiberRoot对象是整个Fiber树的开端**。
3. ReactRoot.render方法是整个react应用渲染的入口，下面会讲到

因为FiberRoot对象是ReactRoot对象内非常重要的对象，因此继续查看DOMRenderer.createContainer   
createContainer方法定义在 [./packages/react-reconciler/src/ReactFiberReconciler.js](https://github.com/aasailan/react/blob/study/packages/react-reconciler/src/ReactFiberReconciler.js)中。createContainer只是简单调用了createFiberRoot方法来创建并返回FiberRoot对象
```javascript
export function createContainer(
  containerInfo: Container,
  isConcurrent: boolean,
  hydrate: boolean,
): OpaqueRoot {
  // 创建并返回FiberRoot对象
  return createFiberRoot(containerInfo, isConcurrent, hydrate);
}
```

### createFiberRoot