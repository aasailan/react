# React 源码阅读笔记
本仓库fork自react原官方仓库，用来做源码学习用。react版本为16.6.1

## 仓库使用

1、clone本仓库
```bash
git clone https://github.com/aasailan/react.git
```

2、进入项目根目录，安装依赖
```bash
cd ./react
yarn install
```

3、检出到study分支
```bash
git checkout study
```

4、查看demo文件夹里面的md文件学习笔记。**如果想要自己阅读修改react源码，可以修改 packages/react/src 目录下的react源码文件，然后使用npm run study-build重新编译得到编译后的文件，具体参考demo文件夹下[demo1章节](https://github.com/aasailan/react/blob/study%2Fbuild/demo/demo1-build-react/readme.md)**

## 仓库学习内容
仓库学习内容参考demo文件夹下

[**demo1**](https://github.com/aasailan/react/blob/study%2Fbuild/demo/demo1-build-react/readme.md)：如何阅读修改react源码  
demo2：理解React.createElement，以及react元素