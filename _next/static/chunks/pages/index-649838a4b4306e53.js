(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[405],{5006:function(e,n,t){"use strict";t.r(n);var r=t(29),a=t(5988),i=t.n(a),s=t(7794),c=t.n(s),o=t(5553),u=t(9008),l=t(7294),x=t(9473),p=t(6870),d=t(8940),f=t(5575),h=t(4739),v=t(3941),m=t(5893),b="Earn - ".concat(p.iC);function g(){var e=(0,l.useState)(!1),n=e[0],t=e[1],a=(0,l.useState)("100"),i=a[0],s=a[1],u=(0,x.v9)(v.qo),d=(0,x.v9)(v.n2),b=(0,x.v9)(v.Cu),g=(0,p.mA)(),j=(0,p.yL)(),_=u===g,w=!d||!g||!j||void 0===b||_,k=w?void 0:function(e){e.preventDefault(),t(!0);var n=(0,o.vz)(i,b),a=j.getSigner();f.LJ.amountDepositable().then(function(){var e=(0,r.Z)(c().mark((function e(r){var i,s;return c().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(!n.gt(r)){e.next=4;break}return alert("Maximum depositable amount is ".concat((0,o.bM)(r,b))),t(!1),e.abrupt("return");case 4:return e.next=6,d.allowance(g,p.ez);case 6:return i=e.sent,s=d.connect(a),e.next=10,s.balanceOf(g);case 10:if(!e.sent.lt(n)){e.next=15;break}return alert("USDC balance too low"),t(!1),e.abrupt("return");case 15:if(!n.gt(i)){e.next=20;break}return e.next=18,s.approve(p.ez,h.P);case 18:return e.next=20,(0,p.Vs)(500);case 20:return e.next=22,f.LJ.connect(a).deposit(n);case 22:t(!1);case 23:case"end":return e.stop()}}),e)})));return function(n){return e.apply(this,arguments)}}())};return(0,m.jsxs)("form",{className:"section",onSubmit:k,children:[(0,m.jsx)("h4",{children:"Deposit"}),_&&(0,m.jsx)("div",{children:"Manager can not deposit"}),(0,m.jsx)("input",{type:"number",inputMode:"decimal",onChange:function(e){s(e.target.value)},value:i}),(0,m.jsx)("button",{disabled:w||n,children:"Deposit"})]})}n.default=function(){return(0,m.jsxs)(d.T3,{children:[(0,m.jsxs)(u.default,{children:[(0,m.jsx)("title",{className:"jsx-963716107",children:b}),(0,m.jsx)("meta",{name:"description",content:"",className:"jsx-963716107"}),(0,m.jsx)("link",{rel:"icon",href:"/favicon.ico",className:"jsx-963716107"})]}),(0,m.jsx)(i(),{id:"963716107",children:[".page>.section{max-width:300px;margin:10px auto;border:1px solid grey;border-radius:8px;text-align:center;padding:20px 0;}",".page>.section>h4{margin:0 0 10px;}","h3{text-align:center;}"]}),(0,m.jsx)(g,{})]})}},5301:function(e,n,t){(window.__NEXT_P=window.__NEXT_P||[]).push(["/",function(){return t(5006)}])}},function(e){e.O(0,[955,774,888,179],(function(){return n=5301,e(e.s=n);var n}));var n=e.O();_N_E=n}]);