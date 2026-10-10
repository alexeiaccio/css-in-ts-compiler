//#region ../../node_modules/.bun/@solidjs+signals@2.0.0-rc.13/node_modules/@solidjs/signals/dist/prod/core/error.js
var e = class extends Error {
	source;
	constructor(e) {
		let t = Error, n = t.stackTraceLimit;
		n !== void 0 && (t.stackTraceLimit = 0), super(), n !== void 0 && (t.stackTraceLimit = n), this.source = e;
	}
}, t = class extends Error {
	source;
	constructor(e, t) {
		super(t instanceof Error ? t.message : String(t), { cause: t }), this.source = e;
	}
};
function n(e) {
	return e instanceof t ? e.cause : e;
}
//#endregion
//#region ../../node_modules/.bun/@solidjs+signals@2.0.0-rc.13/node_modules/@solidjs/signals/dist/prod/core/constants.js
var r = 1024, i = 2048, a = 4096, o = 1024, s = 4096, c = 16384, l = 1 << 17, u = 1 << 20, d = 1 << 26, f = 1 << 21, p = 1 << 22, m = 1 << 24, h = {}, g = {};
function _(e) {
	return e === g ? void 0 : e;
}
var v = {}, ee = Symbol("refresh"), te = /* @__PURE__ */ new Set();
function ne(e) {
	for (; e.ei;) e = e.ei;
	return e;
}
function re(e, t) {
	if (e = ne(e), t = ne(t), e === t) return e;
	t.ei = e;
	for (let n of t.Qe) e.Qe.add(n);
	return t.Qe.clear(), e.dn[0].push(...t.dn[0]), e.dn[1].push(...t.dn[1]), t.dn[0].length = 0, t.dn[1].length = 0, e;
}
function ie(e) {
	let t = e.o?.me;
	if (!t) return;
	let n = ne(t);
	if (te.has(n)) return n;
	e.o !== null && (e.o.me = void 0);
}
function ae(e) {
	if (An(e) && e.o?.Ln) {
		let t = D(e).Ln = et(e.o?.Ln);
		if (t.Rn !== !0) return t;
		e.o !== null && (e.o.Ln = null);
	}
	return ie(e)?.we ?? e.we;
}
function oe(e, t) {
	let n = ne(t), r = e.o?.me;
	if (r) {
		let i = ne(r);
		if (te.has(i)) {
			i !== n && (!An(e) || e.C & 8388608) && (n.ii && ne(n.ii) === i ? (D(e).me = t, e.C |= o) : i.ii && ne(i.ii) === n || re(n, i));
			return;
		}
	}
	D(e).me = t, e.C |= o;
}
//#endregion
//#region ../../node_modules/.bun/@solidjs+signals@2.0.0-rc.13/node_modules/@solidjs/signals/dist/prod/core/scheduler.js
var se = /* @__PURE__ */ new Set(), y = {
	eE: Array(2e3).fill(void 0),
	tE: !1,
	ln: 0,
	EE: 0
}, ce = {
	eE: Array(2e3).fill(void 0),
	tE: !1,
	ln: 0,
	EE: 0
};
function le(e) {
	if (e.oe & 128 && !ue(e)) return C.Ke(e);
	e.oe & 16 ? e.oe &= -140 : (lt(e, ce), e.oe &= -132);
}
function ue(e) {
	let t = e;
	for (; t !== null && t.oe & 32;) t = t._parent;
	return t !== null && !!(t.C & 67108864);
}
var b = 0, x = null, de = !1, fe = !1, pe = !1, me = 0, he = !1, ge = 0, _e = /* @__PURE__ */ new Set();
function ve(e) {
	let t = e.m;
	return se.size === 0 && te.size === 0 && e.ft.length === 0 && t.cn.length === 0 && t.A.length === 0 && t.ti.size === 0 && _e.size === 0 && Te.size === 0;
}
function ye() {
	if (_e.size !== 0) for (let e of _e) {
		if (e.u !== null) {
			_e.delete(e);
			continue;
		}
		e._e === h && (e.o?.Fe === void 0 || e.o?.Fe === h) && (e.o?.t || (_e.delete(e), e.C & 262144 ? fn(e) : e.o?.Hn?.()));
	}
}
function be() {
	return {
		be: b,
		Gn: [],
		le: /* @__PURE__ */ new Map(),
		cn: [],
		A: [],
		ti: /* @__PURE__ */ new Set(),
		pe: [],
		dt: {
			Tt: [[], []],
			ft: []
		},
		Rn: !1,
		In: /* @__PURE__ */ new Set(),
		Dn: null
	};
}
function xe(e, t) {
	t.Rn = e, e.pe.push(...t.pe), e.Te ||= t.Te;
	for (let n of te) n.we === t && (n.we = e);
	t.cn.length && (e.cn.push(...t.cn), t.cn.length = 0), t.A.length && (e.A.push(...t.A), t.A.length = 0);
	for (let n of t.ti) e.ti.add(n);
	for (let [n, r] of t.le) {
		let t = e.le.get(n);
		t || e.le.set(n, t = /* @__PURE__ */ new Set());
		for (let e of r) t.add(e);
	}
	for (let n of t.In) e.In.add(n);
	t.Dn && (e.Dn ??= []).push(...t.Dn);
}
var Se = !1;
function S() {
	if (fe) {
		Ae();
		return;
	}
	de || (de = !0, !me && !w.Jn && (Se = he, Se || queueMicrotask(Ye)));
}
var Ce = [];
function we() {
	for (let e of se) Ce.includes(e) || Ce.push(e);
	S();
}
var Te = /* @__PURE__ */ new Set();
function Ee() {
	let e = Array.from(Te);
	Te.clear();
	for (let t = 0; t < e.length; t++) e[t].se();
}
var De = [], Oe = Symbol.for("solid-js/root-error-hook");
function ke(e) {
	if (fe) return;
	fe = !0;
	let t = "[REACTIVITY_HALTED]", n = e !== void 0 && globalThis.reportError;
	n || e === void 0 ? console.error(t) : console.error(t, e), n && n(e);
}
function Ae() {
	pe || (pe = !0, console.error("[REACTIVITY_HALTED]"));
}
var je = 0, Me = class {
	_parent = null;
	Tt = [[], []];
	ft = [];
	ht = 0;
	created = b;
	addChild(e) {
		this.ft.push(e), e._parent = this;
	}
	removeChild(e) {
		let t = this.ft.indexOf(e);
		t >= 0 && (this.ft.splice(t, 1), e._parent = null);
	}
	notify(e, t, n, r) {
		return this._parent ? this._parent.notify(e, t, n, r) : !1;
	}
	run(e) {
		if (this.Tt[e - 1].length) {
			let t = this.Tt[e - 1];
			this.Tt[e - 1] = [], Xe(t, e);
		}
		let t = this.ft, n = ++je;
		for (let r = 0; r < t.length;) {
			let i = t[r];
			if (i.ht !== n && (i.ht = n, i.run?.(e), t[r] !== i)) {
				r = 0;
				continue;
			}
			r++;
		}
	}
	enqueue(e, t) {
		e && (E ? ne(E).dn[e - 1].push(t) : this.Tt[e - 1].push(t)), S();
	}
	stashQueues(e) {
		e.Tt[0].push(...this.Tt[0]), e.Tt[1].push(...this.Tt[1]), this.Tt = [[], []];
		for (let t = 0; t < this.ft.length; t++) {
			let n = this.ft[t], r = e.ft[t];
			r || (r = {
				Tt: [[], []],
				ft: []
			}, e.ft[t] = r), n.stashQueues(r);
		}
	}
	restoreQueues(e) {
		this.Tt[0].push(...e.Tt[0]), this.Tt[1].push(...e.Tt[1]);
		for (let t = 0; t < e.ft.length; t++) {
			let n = e.ft[t], r = this.ft[t];
			r && r.restoreQueues(n);
		}
	}
}, C = class e extends Me {
	Jn = !1;
	m = be();
	static Ke;
	static en;
	static Cn;
	static _t = null;
	static p = null;
	static G = null;
	static M = null;
	static N = null;
	static Zn = null;
	static jn = null;
	static Ve = null;
	static Ge = null;
	static We = null;
	static ri = null;
	static et = null;
	static nt = null;
	static rt = null;
	static On = null;
	static k = null;
	static Et = null;
	static Nt = null;
	static ot = null;
	static oi = null;
	static ai = null;
	static li = null;
	static si = null;
	static ui = null;
	static lt = null;
	static it = null;
	static tt = null;
	static $n = null;
	static an = null;
	static Sn = null;
	static zn = null;
	static Tn = null;
	static ke = null;
	static Ei = null;
	static ut = null;
	static Me = null;
	static Xn = !1;
	static st = null;
	static fi = null;
	flush() {
		if (!this.Jn) {
			if (x === null && y.EE < y.ln && this.Tt[0].length === 0 && this.Tt[1].length === 0 && this.ft.length === 0 && !Ce.length && !De.length && ve(this)) {
				this.Jn = !0;
				try {
					Pn(), Mt(), We();
				} finally {
					this.Jn = !1;
				}
				b++, de = y.EE >= y.ln || this.Tt[0].length !== 0 || this.Tt[1].length !== 0 || this.m.Gn.length !== 0;
				return;
			}
			this.Jn = !0, Pn();
			try {
				for (; De.length;) this.initTransition(De.pop());
				if (Mt(), ft(y, e.Ke), x && e.Ei?.(x) && ft(y, e.Ke), Te.size && (Ee(), ft(y, e.Ke)), x) {
					if (this.ft.length && (Ke(this, !0), y.EE >= y.ln && ft(y, e.Ke)), !$e(x)) {
						let t = x;
						Ue.length = 0, ft(ce, this.m === t ? le : e.Ke), this.m === t && (Je = this.m = be()), te.size && (e.si(1), e.si(2)), this.stashQueues(t.dt), b++, de = y.EE >= y.ln || this.m.Gn.length > 0, qe(t.Gn), x = null, Ge(null, !0);
						return;
					}
					let t = x, n = this.m;
					if (n !== t && n.Gn.push(...t.Gn), this.restoreQueues(t.dt), se.delete(t), x = null, qe(n.Gn), Ge(t), n === t) {
						let e = be();
						e.Gn = n.Gn, e.cn = n.cn, e.A = n.A, e.ti = n.ti, Je = this.m = e;
					}
				} else ve(this) ? (We(), y.EE >= y.ln && (ft(y, e.Ke), We())) : (se.size && (We(), ft(ce, e.Ke)), Ge());
				b++, de = y.EE >= y.ln || x !== null || this.m.Gn.length !== 0, te.size && e.si(1), this.run(1), te.size && e.si(2), this.run(2);
			} finally {
				for (; !de && !x && Ce.length;) this.initTransition(Ce.pop());
				this.Jn = !1;
			}
		}
	}
	notify(t, n, r, i) {
		if (n & 1) {
			if (r & 1) {
				let n = i ?? t.o?._;
				if (n?.l) return !0;
				if (n && (!x && !t.we && Je.Gn.length && this.initTransition(), x)) {
					let r = n.source, i = x.le.get(r);
					i || x.le.set(r, i = /* @__PURE__ */ new Set());
					let a = i.size;
					i.add(t), i.size !== a && (S(), e.Nt?.(x));
				}
			}
			return !0;
		}
		return !1;
	}
	initTransition(e) {
		if (e && (e = et(e), e.Rn === !0 || e === x) || !e && x && x.be === b) return;
		if (!x) x = e ?? be();
		else if (e) {
			let t = x;
			xe(e, t), this.restoreQueues(t.dt), se.delete(t), x = e;
		}
		se.add(x), x.be = b;
		let t = this.m;
		if (t !== x) {
			let e = this.Jn ? 0 : m;
			for (let n = 0; n < t.Gn.length; n++) {
				let r = t.Gn[n];
				if (r.we === null && r._e !== h && (!r.he || r.oe & 1024 && !(r.h & 4)) && r.xe && r.xe(r.ce, r._e)) {
					r._e = h, Be(r);
					continue;
				}
				r.we = x, r.C |= e, x.Gn.push(r);
			}
			for (let e = 0; e < t.cn.length; e++) {
				let n = t.cn[e];
				n.we = x, x.cn.push(n);
			}
			t.A.length && x.A.push(...t.A);
			for (let e of t.ti) x.ti.add(e);
			if (t.In.size) {
				for (let e of t.In) x.In.add(e);
				t.In.clear();
			}
			Je = this.m = x;
		}
		for (let e of te) e.we ||= x;
		S();
	}
};
function Ne(e) {
	Je.Gn.push(e), w.Jn || Tn();
}
var Pe = !1, Fe = 0;
function Ie() {
	Fe++;
}
var Le = 0;
function Re(e) {
	let t = Le;
	return Le = e, t;
}
function ze(e, t = !1) {
	e.vn = Fe;
	let n = e.C, r = (n & 1024 ? e.o?.me : void 0) || E, o = !!(n & 512) && e.o?.sn !== void 0, s = Pe;
	for (let n = e.u; n !== null; n = n.Ae) {
		let e = n.ge;
		if (s && (e.oe &= ~i), e.oe & 4 && n.Be === e.Ye && n !== e.Nn && (e.oe |= a), o && e.C & 8) {
			e.oe |= 256;
			continue;
		}
		t && r ? (e.oe |= 128, oe(e, r)) : t && (e.oe |= 128, e.o && (e.o.me = void 0)), at(e);
	}
}
function Be(e) {
	let t = e;
	if (!t.he) {
		e._e !== h && (e.ce = e._e, e._e = h), e.C & 256 && C.ri(e);
		return;
	}
	e._e !== h && (e.ce = e._e, e._e = h, t.h &= -5, e.je && e.je !== 3 && (e.Xe = !0), e.o && (e.o.Le = !1)), t.ve = !1, t.oe &= ~r, t.o?._ ?? Ot(t), t.C &= -68157441, t.h & 1 ? e.C |= f : t.h &= -5, t.o != null && (t.o._n !== null || t.o.fn !== null) && C.en(t, !1, !0), e.C & 256 && C.ri(e);
}
var Ve = null, He = [], Ue = [];
function We() {
	for (; Ue.length;) Ot(Ue.pop());
	let e = Je.Gn;
	for (let t = 0; t < e.length; t++) {
		let n = e[t];
		Be(n), n.we = null, n.C & 131072 && (n.C &= ~l, He.push(n));
	}
	e.length = 0, Ve?.();
}
function Ge(e = null, t = !1) {
	let n = Je, r = !t;
	r && We(), !t && w.ft.length && Ke(w);
	let i = e?.Dn, a = r && (e ?? n).cn.length !== 0;
	if (i && !a) for (let e of i) e.oe & 64 || at(e);
	let o = y.EE >= y.ln;
	if (o && ft(y, C.Ke), r) {
		if (Je !== n) {
			if (e === null || e === n) return;
		} else o && We();
		let t = e ?? n;
		if (t.cn.length && C.oi(t.cn), i && a) {
			for (let e of i) e.oe & 64 || at(e);
			S();
		}
		if (t.In.size) {
			for (let e of t.In) e.oe & 64 || at(e);
			t.In.clear(), S();
		}
		if (t.A.length && (C.G(t.A), w.ft.length && Ke(w)), t.ti.size && C._t(t.ti, e), He.length !== 0) {
			for (; He.length;) ze(He.pop());
			y.EE >= y.ln && (ft(y, C.Ke), We());
		}
		ye(), te.size && C.li(e);
	}
}
function Ke(e, t) {
	for (let n of e.ft) t ? n.Re?.() : n.Ee?.(), Ke(n, t);
}
function qe(e) {
	for (let t = 0; t < e.length; t++) e[t].we = x, e[t].C &= ~m;
}
var w = new C(), Je = w.m;
function Ye(e) {
	if (ge > 0) return e ? e() : void 0;
	if (e) {
		me++;
		try {
			return e();
		} finally {
			try {
				Ye();
			} finally {
				me--;
			}
		}
	}
	if (!w.Jn && !fe) {
		for (; de || x;) w.flush();
		Le = 0;
	}
}
function Xe(e, t) {
	for (let n = 0; n < e.length; n++) e[n](t);
}
function Ze(t, n, r) {
	let i = t.oe;
	if (i & 64) return !1;
	if (i & 32) {
		let e = t;
		for (; e && e.oe & 32;) e = e._parent;
		let n = e && (e.we || (e.C & 1048576 ? x : null));
		if (!n && e && e.C & 67108864 && e.o?.me && (n = ne(e.o.me).we), !n || (n = et(n)).Rn === !0 || n === r) return !1;
	}
	for (let e = t.T; e; e = e._parent) if (e.te & 1 && !e.q) return !1;
	if (t.o?.ue?.has(n)) return !0;
	let a = t.Nn;
	for (let e = a === null ? null : t.Ie; e; e = e === a ? null : e.Ne) {
		let t = e.Oe;
		for (; t;) {
			if (t === n || t.De === n || t.o?.ue?.has(n)) return !0;
			t = t.o?.kn;
		}
	}
	return !!(t.h & 1 && t.o?._ instanceof e && t.o?._.source === n);
}
function Qe(e, t, n) {
	let r = e.le.get(t), i = !1;
	for (let e of r ?? []) {
		if (Ze(e, t, n)) return !0;
		n && e.oe & 32 ? i = !0 : r.delete(e);
	}
	return i || e.le.delete(t), !1;
}
function $e(e) {
	if (e.Rn) return !0;
	if (e.pe.length) return !1;
	let t = !0;
	for (let n of e.le.keys()) if (Qe(e, n, e) && n.o?.ue?.size) {
		t = !1;
		break;
	}
	return t && C.ai?.(e) && (t = !1), t && (e.Rn = !0), t;
}
function et(e) {
	for (; e.Rn && typeof e.Rn == "object";) e = e.Rn;
	return e;
}
function tt(e) {
	for (let t of se) if (Qe(t, e)) return t;
	return null;
}
function nt(e) {
	for (let t of se) Qe(t, e) && w.initTransition(t);
}
function rt(e, t) {
	let n = x;
	try {
		return x = et(e), t();
	} finally {
		x = n;
	}
}
//#endregion
//#region ../../node_modules/.bun/@solidjs+signals@2.0.0-rc.13/node_modules/@solidjs/signals/dist/prod/core/heap.js
function it(e) {
	return e.oe & 32 ? ce : y;
}
function at(e) {
	let t = it(e);
	t.ln > e.rn && (t.ln = e.rn), st(e, t);
}
function ot(e, t) {
	let n = (e._parent?.Wn ? e._parent.qn?.rn : e._parent?.rn) ?? -1;
	n >= e.rn && (e.rn = n + 1);
	let r = e.rn, i = t.eE[r];
	if (i === void 0) t.eE[r] = e;
	else {
		let t = i.Fn;
		t.Pn = e, e.Fn = t, i.Fn = e;
	}
	r > t.EE && (t.EE = r);
}
function st(e, t) {
	let n = e.oe;
	n & 1036 || (n & 1 ? e.oe = n & -4 | 10 : (e.oe = n | 8, t.tE && dt(e)), n & 16 || ot(e, t));
}
function ct(e, t) {
	let n = e.oe;
	n & 1052 || (e.oe = n | 16, ot(e, t));
}
function lt(e, t) {
	let n = e.oe;
	if (!(n & 24)) return;
	e.oe = n & -25;
	let r = e.rn;
	if (e.Fn === e) t.eE[r] = void 0;
	else {
		let n = e.Pn, i = t.eE[r], a = n ?? i;
		e === i ? t.eE[r] = n : e.Fn.Pn = n, a.Fn = e.Fn;
	}
	e.Fn = e, e.Pn = void 0;
}
function ut(e) {
	if (!e.tE) {
		e.tE = !0;
		for (let t = 0; t <= e.EE; t++) for (let n = e.eE[t]; n !== void 0; n = n.Pn) n.oe & 8 && dt(n);
	}
}
function dt(e, t = 2) {
	let n = e.oe;
	if (!((n & 3) >= t)) {
		e.oe = n & -4 | t;
		for (let t = e.u; t !== null; t = t.Ae) dt(t.ge, 1);
		if (e.C & 4096) for (let t = e.o.i; t !== null; t = t.Ue) for (let e = t.u; e !== null; e = e.Ae) dt(e.ge, 1);
	}
}
function ft(e, t) {
	for (e.tE = !1, e.ln = 0; e.ln <= e.EE; e.ln++) {
		let n = e.eE[e.ln];
		for (; n !== void 0;) n.oe & 8 ? t(n) : pt(n, e), n = e.eE[e.ln];
	}
	e.EE = 0;
}
function pt(e, t) {
	lt(e, t);
	let n = e.rn;
	for (let t = e.Ie; t; t = t.Ne) {
		let e = t.Oe, r = e.De || e;
		r.he && r.rn >= n && (n = r.rn + 1);
	}
	if (e.rn !== n) {
		e.rn = n;
		for (let t = e.u; t !== null; t = t.Ae) ct(t.ge, it(t.ge));
	}
}
//#endregion
//#region ../../node_modules/.bun/@solidjs+signals@2.0.0-rc.13/node_modules/@solidjs/signals/dist/prod/core/owner.js
function mt(e) {
	let t = e.tn;
	for (; t;) {
		let e = t.oe;
		t.oe = e | 32, e & 24 && (lt(t, e & 32 ? ce : y), e & 8 ? st(t, ce) : ct(t, ce)), mt(t), t = t.un;
	}
}
function ht(e, t = !1, n) {
	let r = e.oe;
	if (r & 64) return;
	if (t && !n && e.o !== null && (e.o._n !== null || e.o.fn !== null) && ht(e, !1, !0), t) {
		e.oe = r | 64;
		let t = e;
		(t.o?.Ze || t.o?.He) && C.ri(t), t.C & 2048 && t.o.Un.forEach(C.ri);
		let n = t.we;
		n && t.h & 1 && !Ce.includes(n) && (Ce.push(n), S());
	}
	t && e.he && e.o !== null && (e.o.Ce = null);
	let i = n ? e.o?._n ?? null : e.tn;
	for (n || (e.tn = null); i;) {
		let e = i;
		e.C &= -33, lt(e, it(e)), kt(e), i.gn = i, ht(i, !0), i = i.un;
	}
	if (n ? e.o !== null && (e.o._n = null) : e.En = 0, t && !n && !(r & 32) && e._parent !== null && !(e._parent.oe & 64)) {
		let t = e.gn, n = e.un;
		t === null ? e._parent.tn = n : t.un = n, n !== null && (n.gn = t), e.gn = null;
	}
	if (_t(e, n), t && e.wn) {
		let t = e.wn;
		e.wn = void 0, t();
	}
}
function gt(e, t) {
	let n = e.tn;
	t.gn = null, t.un = n, n !== null && (n.gn = t), e.tn = t;
}
function _t(e, t) {
	let n = t ? e.o?.fn : e.qe;
	if (n) {
		if (t ? e.o.fn = null : e.qe = null, Array.isArray(n)) for (let e = n.length - 1; e >= 0; e--) {
			let t = n[e];
			t.call(t);
		}
		else n.call(n);
	}
}
function vt(e, t) {
	let n = e;
	for (; n.C & 4 && n._parent;) n = n._parent;
	if (n.id != null) return xt(n.id, t ? n.En++ : n.En);
	throw Error("");
}
function yt(e) {
	return vt(e, !0);
}
function bt(e, t, n) {
	return e?.id ?? (t ? n?.id : n?.id == null ? void 0 : yt(n));
}
function xt(e, t) {
	let n = t.toString(36), r = n.length - 1;
	return e + (r ? String.fromCharCode(64 + r) : "") + n;
}
function St() {
	return T;
}
function Ct(e) {
	return T && (T.qe ? Array.isArray(T.qe) ? T.qe.push(e) : T.qe = [T.qe, e] : T.qe = e), e;
}
function wt(e = !0) {
	ht(this, e);
}
function Tt(e) {
	let t = T, n = e?.transparent ?? !1, r = {
		id: bt(e, n, t),
		C: n ? 4 : 0,
		Wn: !0,
		qn: t?.Wn ? t.qn : t,
		tn: null,
		un: null,
		gn: null,
		qe: null,
		T: t?.T ?? w,
		Je: t?.Je || v,
		En: 0,
		o: null,
		_parent: t,
		dispose: wt
	};
	return t && gt(t, r), r;
}
function Et(e, t) {
	let n = Tt(t);
	return Wn(n, () => e(() => n.dispose()));
}
//#endregion
//#region ../../node_modules/.bun/@solidjs+signals@2.0.0-rc.13/node_modules/@solidjs/signals/dist/prod/core/graph.js
function Dt(e) {
	let t = e.Oe, n = e.Ne, r = e.Ae, i = e.el;
	if (r === null ? t.mn = i : r.el = i, i !== null) i.Ae = r;
	else if (t.u = r, r === null) {
		t.C & 262144 ? fn(t) : t.o?.Hn?.();
		let e = t;
		e.he && e.C & 32 && !(e.oe & 32) && !(e.h & 1) && At(e);
	}
	return n;
}
function Ot(e) {
	let t = e.Nn, n = t === null ? e.Ie : t.Ne;
	if (n !== null) {
		do
			n = Dt(n);
		while (n !== null);
		t === null ? e.Ie = null : t.Ne = null;
	}
}
function kt(e) {
	let t = e.Ie;
	if (t) {
		do
			t = Dt(t);
		while (t !== null);
		e.Ie = null, e.Nn = null;
	}
}
function At(e) {
	lt(e, it(e)), kt(e), ht(e, !0);
}
var jt = /* @__PURE__ */ new Set();
function Mt() {
	if (jt.size !== 0) {
		for (let e of jt) !e.u && e.C & 32 && !(e.h & 1) && !(e.oe & 96) && At(e);
		jt.clear();
	}
}
function Nt(e, t, n = !1) {
	let r = t.Nn;
	if (r !== null && r.Oe === e) {
		r.ze &&= n;
		return;
	}
	let i = null, a = t.oe & 4;
	if (a && (i = r === null ? t.Ie : r.Ne, i !== null && i.Oe === e)) {
		i.Be = t.Ye, t.Nn = i, i.ze = n;
		return;
	}
	let o = e.mn;
	if (o !== null && o.ge === t && (!a || o.Be === t.Ye)) {
		a ? o.ze &&= n : o.ze = n;
		return;
	}
	let s = t.Nn = e.mn = {
		Oe: e,
		ge: t,
		Ne: i,
		el: o,
		Ae: null,
		Be: t.Ye,
		ze: n
	};
	r === null ? t.Ie = s : r.Ne = s, o === null ? e.u = s : o.Ae = s, Ie();
}
//#endregion
//#region ../../node_modules/.bun/@solidjs+signals@2.0.0-rc.13/node_modules/@solidjs/signals/dist/prod/core/async.js
function Pt(e, t) {
	return !e.o?.ue?.has(t) && ((D(e).ue ??= /* @__PURE__ */ new Set()).add(t), !0);
}
function Ft(e, t) {
	let n = e.o?.ue;
	return n?.delete(t) ? (n.size || (e.o.ue = void 0), !0) : !1;
}
function It(e) {
	e.o !== null && (e.o.ue = void 0);
}
function Lt(e, t) {
	for (let n = e.Ie; n; n = n.Ne) {
		let e = n.Oe.De || n.Oe;
		if (e === t || e.o?.ue?.has(t)) return !0;
	}
	return !1;
}
function Rt(e, t) {
	D(e).Pe = !0, t.source && Pt(e, t.source), e.h & 2 || zt(e, t.source, t);
}
function zt(t, n, r) {
	if (!n) {
		t.o !== null && (t.o._ = null);
		return;
	}
	if (r instanceof e && r.source === n) {
		D(t)._ = r;
		return;
	}
	let i = t.o?._;
	(!(i instanceof e) || i.source !== n) && (D(t)._ = new e(n));
}
function Bt(e, t) {
	for (let n = e.u; n !== null; n = n.Ae) t(n.ge, n);
	for (let n = e.o?.i ?? null; n !== null; n = n.Ue) for (let e = n.u; e !== null; e = e.Ae) t(e.ge, e);
}
function Vt(e) {
	e.he && e.C & 32 && !e.u && !(e.oe & 32) && !(e.h & 1) && At(e);
}
function Ht(e) {
	let t, n = /* @__PURE__ */ new Set(), r = (e) => {
		n.has(e) || (n.add(e), !e.u && e.C & 32 && (t ??= []).push(e), Bt(e, r));
	};
	if (Bt(e, r), t) for (let e of t) Vt(e);
}
function Ut(e, t) {
	let n = !1, r = /* @__PURE__ */ new Set(), i = (e) => {
		r.has(e) || (r.add(e), e.o?._ === t && (at(e), n = !0), Bt(e, i));
	};
	Bt(e, i), n && S();
}
function Wt(e, t = e) {
	Ft(e, t);
	let n = !1, r, i = /* @__PURE__ */ new Set(), a = C.Ge, o = (s) => {
		if (i.has(s) || t !== e && Lt(s, t) || !Ft(s, t)) return;
		i.add(s), s.be = b;
		let c = s.o?.ue?.values().next().value, l = s.h & 2;
		c ? (l || zt(s, c), a?.(s)) : (s.h &= -2, l || zt(s), a?.(s), s.o?.Pe && (at(s), n = !0), s.o !== null && (s.o.Pe = !1), !s.u && s.C & 32 && (r ??= []).push(s)), Bt(s, o);
	};
	if (Bt(e, o), r) for (let e of r) Vt(e);
	n && S();
}
function Gt(e) {
	return typeof e == "object" && !!e && typeof e.then == "function";
}
function Kt(e) {
	let t = e.o?.ye;
	t != null && (e.o.ye = null, t());
}
function qt(t, n, r) {
	let i = !1, a = !1;
	if (typeof n == "object" && n && hn(() => {
		i = n[Symbol.asyncIterator], a = !i && Gt(n);
	}), !a && !i) return t.o !== null && (t.o.Ce = null), t.ve = !1, n;
	D(t).Ce = n, t.o.ue = void 0;
	let o = Le, s, c = () => {
		let e = ae(t);
		if (t.o?.me && (e = tt(t) ?? e), e && t.h & 4 && !et(e).le.has(t)) {
			t.we = null;
			return;
		}
		w.initTransition(e), nt(t);
	}, l = (r) => {
		if (t.o?.Ce !== n) return;
		let i = r instanceof e;
		if (i && t.ve) {
			t.o !== null && (t.o.Ce = null), Rt(t, r), t.be = b;
			return;
		}
		c(), Xt(t, i ? 1 : 2, r), i && Wt(t), t.be = b, i || Ht(t);
	}, u = (e, i) => {
		if (t.o?.Ce !== n || t.oe & 130) return;
		Re(o), c();
		let a = !!(t.h & 4), s = t.o?.Le;
		Yt(t), s && (t.o.Le = !0);
		let u = ie(t);
		if (u && u.Qe.delete(t), r) {
			try {
				r(e);
			} catch (e) {
				l(e);
				return;
			}
			a && Yt(t, !0);
		} else if (t.o?.Fe !== void 0 && !(u && t.C & 8388608)) t._e === h && Ne(t), t._e = e, C.Ve?.(t, e), An(t) ? C.ke(t, e) : ze(t), t.be = b;
		else if (u) {
			let n = t.je, r = An(t) ? _(t.o.Fe) : t.ce, i = t.xe;
			try {
				(!n && a || !i || !i(r, e)) && (n ? t.ce = e : C.Me(t, e, u), t.be = b, C.Ve?.(t, e), ze(t, !0));
			} catch (e) {
				Xt(t, 2, e);
			}
		} else try {
			zn(t, () => e);
		} catch (e) {
			Xt(t, 2, e);
		}
		t._e === h && (t.ve = !1, s && (t.o.Le = !1), Ot(t)), Wt(t), S(), Ye(), i?.();
	}, d = () => t.C & 32 && !t.u && !(t.h & 1) ? (At(t), !0) : !1, f = (e, r) => {
		let i = e[Symbol.asyncIterator](), a = !1, o = !1, c = !r, f = () => {
			if (!o) {
				o = !0;
				try {
					let e = i.return?.();
					Gt(e) && e.then(void 0, () => {});
				} catch {}
			}
		};
		r ? r(f) : Ct(f), D(t).ye = f;
		let p = () => {
			d() || m();
		}, m = () => {
			let e, r, f = !1, h = !1, g = !0, _ = i.next();
			if ((Gt(_) ? _ : { then: (e) => void e(_) }).then((r) => {
				if (g && c) e = r, f = !0, r.done && (o = !0);
				else if (t.o?.Ce !== n) return;
				else r.done ? (o = !0, a ? (S(), Ye()) : u(void 0), d()) : (a = !0, u(r.value, p));
			}, (e) => {
				g && c ? (r = e, h = !0) : t.o?.Ce === n && (o = !0, l(e), d());
			}), g = !1, h) {
				if (o = !0, l(r), c) throw r;
				return !0;
			}
			return f && !e.done ? (s = e.value, a = !0, m()) : f && e.done;
		}, h = m();
		return c = !1, a || h;
	}, p = null, m = (e, t) => {
		let n = !1;
		if (typeof e == "object" && e && hn(() => {
			n = e[Symbol.asyncIterator];
		}), !n) return !1;
		let r = f(e, t);
		return t || (p = r), !0;
	};
	if (a) {
		let r = !1, i = !1, a, o = !0, c = (e) => {
			t.qe ? Array.isArray(t.qe) ? t.qe.push(e) : t.qe = [t.qe, e] : t.qe = e;
		};
		if (n.then((e) => {
			o ? (s = e, r = !0) : t.o?.Ce === n && !(t.oe & 64) && m(e, c) || (u(e), d());
		}, (e) => {
			o ? (a = e, i = !0) : (l(e), d());
		}), o = !1, i) throw l(a), a;
		if (r) m(s) || (t.ve = !1);
		else {
			if (t.ve) return t.ce;
			throw w.initTransition(ae(t)), new e(T);
		}
	}
	if (i && m(n), p !== null) {
		if (!p) {
			if (t.ve) return t.ce;
			throw w.initTransition(ae(t)), new e(T);
		}
		t.ve = !1;
	}
	return s;
}
function Jt(e, t = !1) {
	e.o?.ue && It(e), e.o?.Pe && e.o !== null && (e.o.Pe = !1), e.o !== null && (e.o.Le = !1), e.h = t ? 0 : e.h & 4, e.o?._ && zt(e), (e.o?.Ze || e.o?.He) && C.Ge(e), e.o?.i && e.C & 2048 && C.We !== null && C.We(e);
	let n = cn(e);
	n && n.call(e);
}
function Yt(e, t = !1) {
	let n = e.o?.ue;
	n && (n.delete(e), n.size) ? (e.o.Pe = !1, t && (e.h = 1), zt(e, n.values().next().value)) : Jt(e, t);
}
function Xt(n, r, i, a, o) {
	r === 2 && !(i instanceof t) && !(i instanceof e) && (i = new t(n, i));
	let s = r === 1 && i instanceof e ? i.source : void 0, c = s === n, l = r === 1 && n.o?.Fe !== void 0 && !(n.C & 8388608) && !c, u = l && An(n);
	a || (o && oe(n, o), r === 1 && s ? (Pt(n, s), n.h & 1 || (n.C &= ~f), n.h = 1 | n.h & 4, zt(n, s, i)) : (It(n), n.h = r | (r === 2 ? 0 : n.h & 4), D(n)._ = i), C.Ge?.(n), n.o?.i && n.C & 2048 && C.We !== null && C.We(n));
	let d = a || u, p = a || l ? void 0 : o, m = cn(n);
	if (m) {
		if (a && r === 1) return;
		d ? m.call(n, r, i) : m.call(n);
		return;
	}
	Bt(n, (t, n) => {
		if (t.be = b, r === 1 && n.Be !== t.Ye) {
			at(t), S();
			return;
		}
		if (r === 1 && s && !t.o?.ue?.has(s) || r !== 1 && (t.o?._ !== i || t.o?.ue)) {
			if (n.ze && r !== 1 && !(i instanceof e)) {
				at(t), S();
				return;
			}
			d || (t.we ? s && !t.je && (t.h & 1 || t._e !== h) && w.initTransition(t.we) : Ne(t)), Xt(t, r, i, d, p);
		}
	});
}
C.Ke = (e) => {
	e.je === 3 ? (lt(e, it(e)), e.Xe = !0, e.T.enqueue(2, e.$e)) : tn(e);
}, C.en = ht;
var Zt = !1, Qt = !1, $t = !1, en = !1, T = null, E = null;
function tn(t, n = !1) {
	Ie();
	let r = t.je, o = !!(t.oe & 128), s = null;
	if (o ? (s = C.an(t, !0), s === !1 && (o = !1)) : t.C & 8388608 ? (s = C.an(t, !0), s && (o = !0)) : x && !n && x.cn.length && (s = C.an(t, !1), s && (o = !0)), !n) {
		if (t.we && !r && x !== t.we && w.initTransition(t.we), lt(t, it(t)), t.o !== null && (t.o.Ce = null, Kt(t)), r === 3 || t.C & 68157440) ht(t);
		else if (t.tn !== null || t.qe !== null) {
			mt(t);
			let e = D(t);
			e.fn = t.qe, e._n = t.tn, t.qe = null, t.tn = null, t.En = 0, s && (t.C |= d, ne(s).dn[0].push(() => {
				t.C &= ~d, ht(t, !1, !0);
			}));
		}
	}
	let c = !!(t.C & 8388736) && t.o?.Fe !== h && t.o?.Fe !== void 0, l = !!(t.h & 4), f = t.h & 2 ? t.o?._ : void 0, p = !!(t.h & 1), m = p ? t.o?.ue : void 0, g = t.o?.ue?.has(t), v = (t.oe & i) !== 0, ee = t.ve, te = bn;
	bn = null;
	let re = T;
	T = t, t.Nn = null, t.Ye++, t.oe = 4 | t.oe & 32, t.be = b;
	let ie = t._e === h ? t.ce : t._e, ae = t.rn, oe = !1, se = Zt, y = E;
	Zt = !0;
	let ce = en;
	en = !1, r || (E = null), s && (E = s);
	let le = r && r !== 2, ue = Qt;
	le && (Qt = !0), r && x !== null && x.In.size && x.In.delete(t);
	try {
		if (t.C & 64) ie = t.he(ie), t.o !== null && (t.o.Ce = null), t.ve = !1;
		else {
			let e = t.o?.Ce, n = t.he(ie), r = typeof n == "object" && !!n, i = t.o?.Ce !== e;
			ie = i || !r ? n : qt(t, n), !i && !r && (t.o !== null && (t.o.Ce = null), t.ve = !1);
		}
		(t.h !== 0 || t.o !== null) && Jt(t, n && bn === null), t.C & 1024 && t.o?.me && C.Tn(t);
	} catch (n) {
		let r = n instanceof e;
		if (r && t.ve) Rt(t, n);
		else {
			r && E && C.Sn(t);
			let e = !1;
			if (r && (D(t).Pe = !0, C.On !== null && (e = C.On(t, v))), Xt(t, r ? 1 : 2, n, void 0, r ? t.o?.me : void 0), r && g && !t.o?.Ce && Wt(t), r && m) for (let e of m) e !== t && !t.o?.ue?.has(e) && Wt(t, e);
			e && C.k(t);
		}
	} finally {
		Zt = se, en = ce, le && (Qt = ue), oe = (t.oe & a) !== 0, t.oe = t.oe & 96 | (n ? t.oe & 256 : 0), T = re;
	}
	let de = bn;
	if (bn = te, t.oe & 64) {
		kt(t), t.o !== null && (t.o.Ce = null), E = y;
		return;
	}
	if (!t.o?._) {
		let i = c ? _(t.o?.Fe) : o || t._e === h ? t.ce : t._e, a = !1;
		try {
			a = !r && l || !t.xe || !t.xe(i, ie);
		} catch (e) {
			Xt(t, 2, e);
		}
		if (r && a && (t.Xe = !t.o?._, !n)) {
			t.T.enqueue(r, t.An ??= C.Cn.bind(null, t));
			let e = t.pn;
			e !== x && (t.pn = x, e !== null && (e = et(e)) !== x && !e.Rn && ((e.Dn ??= []).push(t), x !== null && (x.Dn ??= []).push(t)));
		}
		if (!t.o?._) {
			if (a) {
				let i = c ? t.o?.Fe : void 0;
				n && de === null || r && de === null && (x !== t.we || x === null || t.C & 32768) || o ? (o && !r && E !== null ? C.Me(t, ie, E) : t.ce = ie, o && (t._e = h)) : (t._e = ie, de !== null && (t.we !== de && (t.we = de, de.Gn.push(t)), r && de.In.add(t), xn(t) && t.T.notify(t, 1, 1, new e(t))), ee && (t.ve = !0), t.C & 256 && C.Ve !== null && C.Ve(t, ie)), t.u !== null && (!c || o || t.o?.Fe !== i) ? ze(t, o || c) : c && !o && t.o.hn !== b && C.ke(t, ie);
			} else if (c) t._e === h && Ne(t), t._e = ie, ee && (t.ve = !0), C.ke(t, ie);
			else if (t.rn != ae) for (let e = t.u; e !== null; e = e.Ae) ct(e.ge, it(e.ge));
		}
		if (!a && !t.o?._ && (f !== void 0 && Ut(t, f), m)) for (let e of m) e !== t && Wt(t, e);
		g && !(t.h & 5) && (Wt(t), we());
	}
	let fe = t.Nn;
	r && (p && !(t.h & 1) || (fe === null ? t.Ie !== null : fe.Ne !== null)) && we(), !t.o?._ && t._e === h && !(r && t.Xe) && (n || o || r === 3 ? Ot(t) : (t.Nn?.Ne ?? t.Ie) && Ue.push(t)), E = y;
	let pe = (t.C & d) !== 0, me = (t._e !== h || !pe && t.o !== null && (t.o._n !== null || t.o.fn !== null) || !!(t.h & 5)) && (!n || de !== null || !!(t.h & 1));
	if (me && (!t.we || c) ? Ne(t) : me && (x === null || o) && !(t.h & 5) && (me = !1, pe || ht(t, !1, !0)), me ? t.C |= u : t.C &= ~u, t.we && r && x !== t.we && de === null) {
		let e = t.pn;
		rt(t.we, () => tn(t)), t.pn = e;
	}
	oe && (at(t), S());
}
function nn(e) {
	if (!(e.oe & 68)) {
		if (e.oe & 1) for (let t = e.Ie; t; t = t.Ne) {
			let n = t.Oe, r = n.De || n;
			if (r.he && nn(r), e.oe & 2) break;
		}
		(e.oe & 130 || e.o?._ && e.be < b && !e.o?.Ce) && tn(e), e.oe &= 376 | r;
	}
}
function rn(e, t) {
	let n = t?.transparent ?? !1, r = typeof t == "object" && !!t && "loadingValue" in t, i = {
		id: bt(t, n, T),
		C: (n ? 4 : 0) | !!t?.ownedWrite | (!T || t?.lazy ? 32 : 0) | (t?.sync ? 64 : 0) | (t?.H ? 2 : 0) | 0,
		xe: t?.equals ?? mn,
		qe: null,
		T: T?.T ?? w,
		Je: T?.Je ?? v,
		En: 0,
		he: e,
		ce: r ? t.loadingValue : void 0,
		rn: 0,
		Pn: void 0,
		Fn: null,
		Ie: null,
		Nn: null,
		Ye: 0,
		u: null,
		mn: null,
		_parent: T,
		un: null,
		gn: null,
		tn: null,
		oe: t?.lazy ? 512 : 0,
		h: r ? 0 : 4,
		be: b,
		_e: h,
		we: null,
		vn: -1,
		ve: r,
		o: null
	};
	return t?.unobserved && (D(i).Hn = t.unobserved), un(i, t), i;
}
function D(e) {
	return e.o ??= {
		Fe: void 0,
		Ln: void 0,
		hn: 0,
		bn: h,
		Vn: 0,
		me: void 0,
		Ze: void 0,
		He: void 0,
		kn: void 0,
		t: 0,
		Ce: null,
		ye: null,
		_: void 0,
		Pe: void 0,
		ue: void 0,
		S: void 0,
		Le: !1,
		i: null,
		Hn: void 0,
		sn: void 0,
		fn: null,
		_n: null,
		Un: void 0
	};
}
function an(e, t, n, r, i) {
	let a = i?.transparent ?? !1, o = {
		id: bt(i, a, T),
		C: (a ? 4 : 0) | !!i?.ownedWrite | (i?.sync ? 64 : 0) | (i?.yn ?? 0) | 0,
		xe: !1,
		qe: null,
		T: T?.T ?? w,
		Je: T?.Je ?? v,
		En: 0,
		he: e,
		ce: void 0,
		rn: 0,
		Pn: void 0,
		Fn: null,
		Ie: null,
		Nn: null,
		Ye: 0,
		u: null,
		mn: null,
		_parent: T,
		un: null,
		gn: null,
		tn: null,
		oe: 512,
		h: 4,
		be: b,
		_e: h,
		we: null,
		vn: -1,
		ve: !1,
		Xe: !1,
		xn: void 0,
		Qn: t,
		Mn: n,
		wn: void 0,
		je: r,
		pn: null,
		o: null
	};
	return i?.unobserved && (D(o).Hn = i.unobserved), un(o, ln), o;
}
var on = null;
function sn(e) {
	on = e;
}
function cn(e) {
	let t = e.o?.S;
	return t === void 0 ? e.je ? on ?? void 0 : void 0 : t;
}
var ln = { lazy: !0 };
function un(e, t) {
	e.Fn = e;
	let n = T?.Wn ? T.qn : T;
	T && gt(T, e), n && (e.rn = n.rn + 1), C.Zn !== null && C.Zn(e), !t?.lazy && tn(e, !0);
}
function dn(e, t, n = null) {
	let r = {
		xe: t?.equals ?? mn,
		C: +!!t?.ownedWrite | (t?.H ? 2 : 0),
		ce: e,
		u: null,
		mn: null,
		be: b,
		De: n,
		Ue: n?.o?.i || null,
		Yn: null,
		_e: h,
		we: null,
		vn: -1,
		o: null
	};
	return t?.unobserved && (D(r).Hn = t.unobserved), n && pn(n, r), r;
}
var fn;
function pn(e, t) {
	let n = t.Ue;
	n !== null && (n.Yn = t), D(e).i = t, e.C |= s;
}
function mn(e, t) {
	return e === t;
}
function hn(e, t) {
	if (C.jn === null && !Zt) return e();
	let n = Zt;
	Zt = !1;
	try {
		return C.jn === null ? e() : C.jn(e);
	} finally {
		Zt = n;
	}
}
function gn(e, t) {
	if (e.oe & 512) e.oe &= -513, tn(e, !0);
	else if (e.oe & 64) {
		if (e.C & 32) {
			let t = e._parent;
			if (t !== null) {
				if (t.oe & 64) {
					e.C &= -33;
					return;
				}
				e.oe & 32 || gt(t, e);
			}
			tn(e, !0);
		}
	} else t && nn(e);
}
function _n(e, t) {
	let n = t.pn;
	(n == null || et(n) !== e) && e.In.add(t);
}
function vn(e) {
	return x !== null && et(e) === et(x);
}
function yn(e, t) {
	let n = e.we;
	if (n === null || vn(n)) return !1;
	let r = et(n);
	_n(r, t);
	let i = r.le.get(e);
	return i ? i.add(t) : e.h & 1 && rt(r, () => t.T.notify(t, 1, 1, e.o._)), !0;
}
var bn = null;
function xn(e) {
	for (let t = e.T; t !== null; t = t._parent) if (t.te & 1) return !t.q;
	return !1;
}
function Sn(e, t = e.we) {
	if (!t || t === x || e?.o?.kn || T?.o?.kn) return;
	let n = T, r = x === null && !w.Jn;
	if (!(r && C.Xn)) {
		if (n.oe & 4 && !(n.C & 128) && (bn === null || bn === t) && (r || !C.Xn && xn(n))) {
			bn = t;
			return;
		}
		w.initTransition(t);
	}
}
function Cn(e, t, n, r) {
	return !!(!t || E !== null && C.$n(e, n, t) || e._e === h || t.C & 16 || Qt && !r && yn(e, t) || e.C & 131072 && E !== null && !en && !(t.C & 8192));
}
var wn = !1;
function Tn() {
	wn = !0;
}
function En(e, t = e.ce) {
	return w.Jn || e._e === h || e.C & 4194304 || e.o?.kn ? h : e.we === null || e.C & 16777216 ? t : e.o === null ? h : e.o.bn;
}
var Dn = [], On = [];
function kn(e) {
	return !w.Jn && e.o?.hn === b && !e.o?.kn;
}
function An(e) {
	let t = e.o;
	return t !== null && t.Fe !== void 0 && t.Fe !== h;
}
function jn(e) {
	return An(e) && !kn(e);
}
function Mn(e) {
	return e.oe |= a, !0;
}
var Nn = [];
function Pn() {
	if (wn = !1, Dn.length !== 0) {
		for (let e of Dn) e.o.bn = h;
		Dn.length = 0;
	}
	if (On.length !== 0) {
		for (let e of On) e.C &= ~p;
		On.length = 0;
	}
	if (Nn.length !== 0) {
		for (let e of Nn) C.Ve(e, e._e === h ? e.ce : e._e);
		Nn.length = 0;
	}
}
function Fn(e) {
	if (en) return C.et(e);
	let t = T;
	t?.Wn && (t = t.qn);
	let n = e, r = e.De || e;
	if (typeof n.he == "function" && gn(e, !1), !n.he && r === e && e.o?.Fe === void 0 && e.o?.sn === void 0 && x === null && E === null && (!wn || e._e === h)) return t && Zt && Nt(e, t), !t || e._e === h || t.C & 16 || Qt && yn(e, t) ? e.ce : (Sn(e), e._e);
	if (t && Zt && (Nt(e, t, $t), r.he)) {
		let n = it(e);
		r.rn >= n.ln ? (dt(t), ut(n), nn(r)) : t.C & 65536 && nn(r);
		let i = r.rn;
		i >= t.rn && e._parent !== t && (t.rn = i + 1);
	}
	if (r.h & 1) {
		if (t && (!Qt || r.h & 4 || r.C & 2097152 || r.C & 1024 && C.tt(r) || !yn(r, t))) {
			if (E === null || C.it(r)) throw !Zt && e !== t && Nt(e, t), r.o?._;
		} else if (!t && r.h & 4 && !(An(e) && e.C & 8388608)) throw r.o?._;
	}
	if (r.he && r.h & 2) {
		if (Zt && r.be < b) return tn(r), Fn(e);
		throw r.o?._;
	}
	let i = In(e, t, r, e.ce);
	return !t && r === e && typeof n.he == "function" && e.C & 32 && !(r.h & 1) && !e.u && !jn(e) && (jt.add(e), S()), i;
}
function In(t, n, r, i) {
	if (An(t)) {
		if (!(n && n.C & 8192) && !kn(t)) return n && t.C & 525312 ? C.ut(t, n) : _(t.o?.Fe);
		t.C |= c;
	}
	if (E !== null && x !== null && n !== null && C.lt(t, r, n)) return i;
	let a = t._e !== h && !!(t.h & 4);
	if (a && !n) throw new e(null);
	let o = n && wn ? En(t, i) : h;
	return o === h ? Cn(t, n, r, a) ? i : (Sn(t), t._e) : (Mn(n), o);
}
function Ln(e) {
	if (w.Jn) return;
	let t = D(e);
	t.bn === h && (t.bn = e._e, Dn.push(e), wn = !0);
}
function Rn(e) {
	w.Jn || e.C & 4194304 || (e.C |= p, On.push(e));
}
function zn(e, t) {
	if (e.we && x !== e.we && (w.Jn ? w.initTransition(e.we) : (De.push(e.we), S())), e.C & 128) return C.ot(e, t);
	let n = e._e === h ? e.ce : e._e;
	if (typeof t == "function" && (t = t(n)), !(e.h & 4 || !e.xe || !e.xe(n, t))) return t;
	let r = e._e !== h;
	return r ? e.we !== null && Ln(e) : Ne(e), e._e = t, T !== null && Rn(e), e.C & 256 && C.Ve !== null && (C.Ve(e, t), w.Jn || Nn.push(e)), e.he !== void 0 && (e.be = b), r && e.vn === Fe && E === null ? t : (ze(e), S(), t);
}
function Bn(e) {
	lt(e, it(e)), !(e.oe & 1024) && e._e === h && (Ne(e), S()), e.oe = e.oe & -4 | r, e.ct = b;
}
function Vn(e) {
	return e.we !== null && x !== e.we && !((e.De || e).oe & 1024);
}
function Hn(e) {
	e.oe |= 2, at(e);
}
function Un(e, t) {
	let n = Vn(e);
	n && typeof t == "function" && (t = t(e.ce));
	let r = zn(e, t);
	return n ? Hn(e) : Bn(e), r;
}
function Wn(e, t) {
	let n = T, r = Zt;
	T = e, Zt = !1;
	try {
		return t();
	} finally {
		T = n, Zt = r;
	}
}
function Gn(e, t = !0) {
	let n = Qt;
	Qt = t;
	try {
		return e();
	} finally {
		Qt = n;
	}
}
//#endregion
//#region ../../node_modules/.bun/@solidjs+signals@2.0.0-rc.13/node_modules/@solidjs/signals/dist/prod/core/effect.js
function Kn(e, t, n, r) {
	let i = an(e, t, n, r?.user ? 2 : 1, r);
	tn(i, !0), !r?.defer && i._e === h && (i.je === 2 || r?.schedule ? i.T.enqueue(i.je, Jn.bind(null, i)) : Jn(i, 4));
}
function qn(e, t) {
	let r = e === void 0 ? this.h : e, i = t === void 0 ? this.o?._ : t;
	if (r & 2) {
		if (this.T.notify(this, 1, 0), this.je === 2) {
			this.h & 2 && (this.Xe = !0, this.T.enqueue(this.je, this.An ??= Jn.bind(null, this)));
			return;
		}
		if (!this.T.notify(this, 2, 2)) throw ke(n(i)), i;
	} else this.je === 1 && this.T.notify(this, 3, r, i);
}
function Jn(e, r) {
	if (!e.Xe || e.oe & 64) return;
	if (e.pn !== null && !et(e.pn).Rn && (r & 4 ? !e.o?.me : x !== null)) {
		e.T.enqueue(e.je, e.An);
		return;
	}
	if (e.h & 2 && e.je === 2) {
		let t = n(e.o?._);
		e.xn = e.ce, e.Xe = !1;
		try {
			e.Mn ? e.Mn(t, () => {
				let t = e.wn;
				e.wn = void 0, t?.();
			}) : console.error(t);
		} catch (t) {
			if (!e.T.notify(e, 2, 2)) throw ke(t), t;
		}
		return;
	}
	let i = e.o?._ == null, a = e.wn;
	e.wn = void 0;
	try {
		a?.(), e.wn = e.Qn(e.ce, e.xn);
	} catch (n) {
		if (D(e)._ = new t(e, n), e.h |= 2, !e.T.notify(e, 2, 2)) throw ke(n), n;
	} finally {
		e.xn = e.ce, e.Xe = !1, i && Ot(e);
	}
}
C.Cn = Jn;
function Yn(e, t) {
	let n = () => {
		if (!(!r.Xe || r.oe & 64)) try {
			r.Xe = !1, tn(r);
		} finally {}
	}, r = rn(() => {
		let t = r.wn;
		r.wn = void 0, t?.();
		let n = Gn(e);
		r.wn = n;
	}, {
		...t,
		lazy: !0
	});
	r.wn = void 0, r.C = r.C & -33 | 16, r.Xe = !0, r.je = 3, r.$e = n, at(r), S();
}
sn(qn);
//#endregion
//#region ../../node_modules/.bun/@solidjs+signals@2.0.0-rc.13/node_modules/@solidjs/signals/dist/prod/signals.js
function Xn(e) {
	return Ct(e);
}
function Zn(e) {
	let t = Fn.bind(null, e);
	return t[ee] = e, t;
}
function Qn(e, t) {
	if (typeof e == "function") {
		let n = rn(e, t);
		return n.C &= -33, [Zn(n), Un.bind(null, n)];
	}
	let n = dn(e, t);
	return [Zn(n), zn.bind(null, n)];
}
function $n(e, t) {
	return Zn(rn(e, t));
}
function er(e, t, n) {
	Kn(e, t.effect || t, t.error, {
		user: !0,
		...n
	});
}
function tr(e, t, n) {
	Kn(e, t, void 0, n);
}
function nr(e) {
	let t = St();
	t && !(t.C & 16) ? Yn(() => hn(e), void 0) : w.enqueue(2, function t() {
		if (y.EE >= y.ln) return w.enqueue(2, t);
		e();
	});
}
//#endregion
//#region ../../node_modules/.bun/@solidjs+signals@2.0.0-rc.13/node_modules/@solidjs/signals/dist/prod/store/store.js
var rr = Symbol(0), ir = Symbol(0);
function ar(e) {
	return Reflect.ownKeys(e).filter((t) => Object.prototype.propertyIsEnumerable.call(e, t));
}
//#endregion
//#region ../../node_modules/.bun/@solidjs+signals@2.0.0-rc.13/node_modules/@solidjs/signals/dist/prod/map.js
function or(e, t, n) {
	let r = typeof n?.keyed == "function" ? n.keyed : void 0, i = t.length > 1, a = t, o = {
		ie: Tt(),
		wt: 0,
		Ot: e,
		yt: [],
		At: a,
		Mt: [],
		St: [],
		Kn: r,
		jt: r || n?.keyed === !1 ? [] : void 0,
		kt: i && n?.keyed !== !1 ? [] : void 0,
		gt: n?.keyed === !1,
		bt: n?.fallback
	}, s = rn(ur.bind(o), void 0);
	return o.ie.qn = s, s.C &= -33, Zn(s);
}
var sr = { ownedWrite: !0 };
function cr(e, t, n, r) {
	let i = e.yt, a = e.wt - 1, o = [], s = [], c = [], l = 256, u = r, d = r, f = !1;
	for (; u <= a && d <= n - 1;) {
		let e = i[u], r = t[d];
		if (e === r) {
			f ||= (c.push(u, d, 0), !0), c[c.length - 1]++, u++, d++;
			continue;
		}
		f = !1;
		let p = -1, m = Math.min(32 - o.length, a - u, l);
		for (let e = 1; e <= m; e++) if (i[u + e] === r) {
			p = e;
			break;
		}
		l -= p === -1 ? m : p;
		let h = -1;
		m = Math.min(32 - s.length, n - 1 - d, l);
		for (let n = 1; n <= m; n++) if (t[d + n] === e) {
			h = n;
			break;
		}
		if (l -= h === -1 ? m : h, p !== -1 && (h === -1 || p <= h)) {
			for (; p-- > 0;) o.push(u++);
			continue;
		}
		if (h !== -1) {
			for (; h-- > 0;) s.push(d++);
			continue;
		}
		if (l <= 0 || o.length === 32 || s.length === 32) return !1;
		o.push(u++), s.push(d++);
	}
	for (; u <= a; u++) {
		if (o.length === 32) return !1;
		o.push(u);
	}
	for (; d <= n - 1; d++) {
		if (s.length === 32) return !1;
		s.push(d);
	}
	return lr(e, t, n, o, s, c);
}
function lr(e, t, n, r, i, a) {
	let o = e.yt, s, c, l;
	if (i.length !== 0) for (l = Array(r.length), c = 0; c < i.length; c++) {
		let e = -1;
		for (s = 0; s < r.length; s++) if (!l[s] && o[r[s]] === t[i[c]]) {
			e = s;
			break;
		}
		if (e === -1) return !1;
		l[e] = !0, i[c] = i[c] << 6 | e;
	}
	if (r.length !== 0 || i.length !== 0) {
		let e = /* @__PURE__ */ new Set();
		for (s = 0; s < r.length; s++) e.add(o[r[s]]);
		for (c = 0; c < i.length; c++) e.add(t[i[c] >> 6]);
		for (let t = 0; t < a.length; t += 3) {
			let n = a[t];
			for (let r = 0, i = a[t + 2]; r < i; r++) if (e.has(o[n + r])) return !1;
		}
	}
	let u = e.Mt, d = e.St, f = u.slice(0, n), p = d.slice(0, n);
	for (let e = 0; e < a.length; e += 3) {
		let t = a[e], n = a[e + 1];
		if (t !== n) for (let r = 0; r < a[e + 2]; r++) f[n + r] = u[t + r], p[n + r] = d[t + r];
	}
	for (c = 0; c < i.length; c++) {
		let e = i[c] >> 6, t = r[i[c] & 63];
		f[e] = u[t], p[e] = d[t];
	}
	for (e.Mt = f, e.St = p, e.wt = n, e.yt = t.slice(0), s = 0; s < r.length; s++) (l === void 0 || !l[s]) && d[r[s]].dispose();
	return !0;
}
function ur() {
	let e = this.Ot() || [], t = e.length;
	return e[rr], Wn(this.ie, () => {
		let n, r, i, a, o = this.jt ? this.gt ? () => (i[r] = dn(e[r], sr), this.At(Zn(i[r]), r)) : () => (i[r] = dn(e[r], sr), a && (a[r] = dn(r, sr)), this.At(Zn(i[r]), a ? Zn(a[r]) : void 0)) : this.kt ? () => {
			let t = e[r];
			return a[r] = dn(r, sr), this.At(t, Zn(a[r]));
		} : () => {
			let t = e[r];
			return this.At(t);
		};
		if (t === 0) this.wt !== 0 && (this.ie.dispose(!1), this.St = [], this.yt = [], this.Mt = [], this.wt = 0, this.jt &&= [], this.kt &&= []), this.bt && !this.Mt[0] && (this.St[0]?.dispose(), this.Mt[0] = Wn(this.St[0] = Tt(), this.bt));
		else if (this.wt === 0) {
			let s = Array(t), c = Array(t);
			i = this.jt && Array(t), a = this.kt && Array(t);
			try {
				for (r = 0; r < t; r++) s[r] = Wn(c[r] = Tt(), o);
			} catch (e) {
				for (n = 0; n <= r; n++) c[n]?.dispose();
				throw e;
			}
			this.St[0] && this.St[0].dispose(), this.Mt = s, this.St = c, i && (this.jt = i), a && (this.kt = a), this.yt = e.slice(0), this.wt = t;
		} else {
			let s, c, l, u, d, f, p, m, h, g = (this.Wt = E !== null || this.Wt && te.size !== 0) ? C.st : zn;
			for (s = 0, c = Math.min(this.wt, t); s < c && (this.yt[s] === e[s] || this.jt && dr(this.Kn, this.yt[s], e[s])); s++) this.jt && g(this.jt[s], e[s]);
			for (c = this.wt - 1, l = t - 1; c >= s && l >= s && (this.yt[c] === e[l] || this.jt && dr(this.Kn, this.yt[c], e[l])); c--, l--);
			if (s === t && this.wt === t) {
				this.yt = e.slice(0);
				return;
			}
			if (t <= this.wt && c - s > 64 && this.jt === void 0 && this.kt === void 0) {
				let n = s + (l - s >> 1), r = e[n], i = Math.min(c, n + 32), a = Math.max(s, n - 32);
				for (; a <= i && this.yt[a] !== r;) a++;
				if (a <= i && cr(this, e, t, s)) return;
			}
			let _ = t - this.wt, v = Array(t), ee = Array(t);
			for (i = this.jt ? Array(t) : void 0, a = this.kt ? Array(t) : void 0, f = /* @__PURE__ */ new Map(), p = Array(l + 1), r = l; r >= s; r--) u = e[r], d = this.Kn ? this.Kn(u) : u, n = f.get(d), p[r] = n === void 0 ? -1 : n, f.set(d, r);
			for (n = s; n <= c; n++) u = this.yt[n], d = this.Kn ? this.Kn(u) : u, r = f.get(d), r !== void 0 && r !== -1 ? (v[r] = this.Mt[n], ee[r] = this.St[n], i && (i[r] = this.jt[n]), a && (a[r] = this.kt[n]), r = p[r], f.set(d, r)) : (m ??= []).push(this.St[n]);
			try {
				for (r = s; r <= l; r++) ee[r] === void 0 && ((h ??= []).push(ee[r] = Tt()), v[r] = Wn(ee[r], o));
			} catch (e) {
				if (h) for (n = 0; n < h.length; n++) h[n].dispose();
				throw e;
			}
			for (n = 0; n < s; n++) v[n] = this.Mt[n], ee[n] = this.St[n], i && (i[n] = this.jt[n]), a && (a[n] = this.kt[n]);
			for (r = s; r <= l; r++) i && g(i[r], e[r]), a && g(a[r], r);
			for (r = l + 1; r < t; r++) v[r] = this.Mt[r - _], ee[r] = this.St[r - _], i && (i[r] = this.jt[r - _], g(i[r], e[r])), a && (a[r] = this.kt[r - _], _ !== 0 && g(a[r], r));
			if (this.Mt = v, this.St = ee, i && (this.jt = i), a && (this.kt = a), this.wt = t, this.yt = e.slice(0), m) for (n = 0; n < m.length; n++) m[n].dispose();
		}
	}), this.Mt;
}
function dr(e, t, n) {
	return !e || e(t) === e(n);
}
//#endregion
//#region ../../node_modules/.bun/@solidjs+signals@2.0.0-rc.13/node_modules/@solidjs/signals/dist/prod/boundaries.js
function fr(e, t) {
	if (typeof e == "function" && !e.length) {
		if (t?.doNotUnwrap) return e;
		do
			e = e();
		while (typeof e == "function" && !e.length);
	}
	if (!t?.skipNonRendered || e != null && e !== !0 && e !== !1 && e !== "") {
		if (Array.isArray(e)) {
			let n = [];
			return pr(e, n, t) ? () => {
				let e = [];
				return pr(n, e, {
					...t,
					doNotUnwrap: !1
				}), e;
			} : n;
		}
		return e;
	}
}
function pr(t, n = [], r) {
	let i = null, a = !1;
	for (let o = 0; o < t.length; o++) try {
		let e = t[o];
		if (typeof e == "function" && !e.length) {
			if (r?.doNotUnwrap) {
				n.push(e), a = !0;
				continue;
			}
			do
				e = e();
			while (typeof e == "function" && !e.length);
		}
		Array.isArray(e) ? a = pr(e, n, r) || a : r?.skipNonRendered && (e == null || e === !0 || e === !1 || e === "") || n.push(e);
	} catch (t) {
		if (!(t instanceof e)) throw t;
		i = t;
	}
	if (i) throw i;
	return a;
}
var mr = Object.freeze({});
function hr(e, t) {
	return t === 3 ? (e = e()) ?? mr : e;
}
function gr(e, t) {
	let n = e.hidden;
	return typeof n == "function" ? n(t) : n.includes(t);
}
function _r(e) {
	return hr(e.source, e.kind);
}
function vr(e, t) {
	return t === 0 ? Object.keys(e) : t === 2 || e[ir] === e ? Reflect.ownKeys(e) : Object.keys(e);
}
function yr(e, t) {
	if (t === 1) {
		if (e.kind === 4) return xr(e.source, !1, e);
		let t = vr(_r(e), e.kind), n = [];
		for (let r = 0; r < t.length; r++) gr(e, t[r]) || n.push(t[r]);
		return n;
	}
	return vr(hr(e, t), t);
}
function br(e, t) {
	if (e !== void 0) {
		for (let n = e.length - 1; n >= 0; n--) if (gr(e[n], t)) return !0;
	}
	return !1;
}
function xr(e, t, n) {
	let r = [];
	return Sr(e, n === void 0 ? void 0 : [n], t, r, null), r;
}
function Sr(e, t, n, r, i) {
	let a = e.sources, o = e.kinds;
	for (let e = 0; e < a.length; e++) {
		let s = a[e], c = o[e], l;
		if (c === 1) {
			if (s.kind === 4) {
				t === void 0 ? t = [s] : t.push(s), Sr(s.source, t, n, r, i), t.pop();
				continue;
			}
			l = s, c = s.kind, s = s.source;
		}
		s = hr(s, c);
		let u = n ? ar(s) : vr(s, c);
		for (let e = 0; e < u.length; e++) {
			let n = u[e];
			l !== void 0 && gr(l, n) || br(t, n) || Cr(r, i, n, s);
		}
	}
}
function Cr(e, t, n, r) {
	let i = e.indexOf(n);
	i !== -1 && (e.splice(i, 1), t !== null && t.splice(i, 1)), e.push(n), t !== null && t.push(r);
}
//#endregion
//#region ../../node_modules/.bun/solid-js@2.0.0-rc.13/node_modules/solid-js/dist/solid.js
var wr = !1, Tr = {
	hydrating: !1,
	registry: void 0,
	done: !1
}, Er = (...e) => $n(...e), Dr = (...e) => Qn(...e), Or = (...e) => Et(...e), kr = (...e) => tr(...e), Ar = (...e) => er(...e);
function O(e, t, n) {
	return hn(() => e(t || {}));
}
var jr = (e) => `Stale read from <${e}>.`;
function Mr(e) {
	let t = "fallback" in e ? {
		keyed: e.keyed,
		fallback: () => e.fallback
	} : { keyed: e.keyed }, n = St(), r, i = () => Wn(n, () => or(() => e.each, e.children, t));
	return Tr.hydrating && (r = i()), () => (r ??= i())();
}
function Nr(e) {
	let t = e.keyed, n = $n(() => e.when, void 0), r = t ? n : $n(n, {
		equals: (e, t) => !e == !t,
		sync: !0
	});
	return $n(() => {
		let i = r();
		if (i) {
			let a = e.children;
			return typeof a == "function" && a.length > 0 ? hn(t ? () => a(i) : () => a(() => {
				if (!hn(r)) throw jr("Show");
				return n();
			}), wr) : a;
		}
		return e.fallback;
	}, { sync: !0 });
}
//#endregion
//#region ../../node_modules/.bun/solid-js@2.0.0-rc.13/node_modules/solid-js/dist/internal.js
var Pr = Tr, Fr = /*#__PURE__*/ Symbol("slot"), Ir = /*#__PURE__*/ Symbol("host"), Lr = {
	transparent: !0,
	sync: !0
}, Rr = { sync: !0 };
function k(e, t, n) {
	kr(e, t, n ? {
		sync: !0,
		...n,
		transparent: !n.scope
	} : Lr);
}
function zr(e) {
	return Er(() => e(), Rr);
}
function Br(e, t, n, r) {
	let i = n.length, a = t.length, o = i, s = 0, c = 0, l = t[a - 1], u = l[Fr], d = l.parentNode === e && (!u || u === r) ? l.nextSibling : r || null, f = null, p, m, h = (t) => {
		if (!t) return !1;
		let n = t[Fr];
		return t.parentNode === e && (!n || n === r);
	};
	for (; s < a || c < o;) {
		if (t[s] === n[c] && h(t[s])) {
			s++, c++;
			continue;
		}
		for (; t[a - 1] === n[o - 1] && h(t[a - 1]);) a--, o--;
		if (a === s) {
			let t;
			if (o < i) {
				if (c) {
					let i = n[c - 1], a = i[Fr];
					t = i.parentNode === e && (!a || a === r) ? i.nextSibling : d;
				} else t = n[o - c];
			} else t = d;
			for (; c < o;) {
				let i = n[c++];
				e.insertBefore(i, t), r && (i[Fr] = r);
			}
		} else if (o === c) for (; s < a;) {
			let n = t[s++];
			if (!f || !f.has(n)) {
				let t = n[Fr];
				n.parentNode === e && (!t || t === r) && n.remove();
			}
		}
		else if ((p = t[s]) === n[o - 1] && n[c] === t[a - 1] && p.parentNode === e && (!(m = p[Fr]) || m === r)) {
			if (r) do {
				let n = t[--a];
				if (e.insertBefore(n, p), n[Fr] = r, c++, s >= a - 1 || c >= o) break;
			} while (t[s] === n[o - 1] && n[c] === t[a - 1]);
			else do
				if (e.insertBefore(t[--a], p), c++, s >= a - 1 || c >= o) break;
			while (t[s] === n[o - 1] && n[c] === t[a - 1]);
		} else {
			if (!f) {
				f = /* @__PURE__ */ new Map();
				let e = c;
				for (; e < o;) f.set(n[e], e++);
			}
			let i = f.get(t[s]);
			if (i != null) {
				if (c < i && i < o) {
					let l = s, u = 1, p;
					for (; ++l < a && l < o && (p = f.get(t[l])) != null && p === i + u;) u++;
					if (u > i - c) {
						let a = t[s], o = a[Fr], l = a.parentNode === e && (!o || o === r) ? a : d;
						for (; c < i;) {
							let t = n[c++];
							e.insertBefore(t, l), r && (t[Fr] = r);
						}
					} else {
						let i = t[s++], a = n[c++], o = i[Fr];
						i.parentNode === e && (!o || o === r) ? e.replaceChild(a, i) : e.insertBefore(a, d), r && (a[Fr] = r);
					}
				} else s++;
			} else {
				let n = t[s++], i = n[Fr];
				n.parentNode === e && (!i || i === r) && n.remove();
			}
		}
	}
}
var Vr = "_$$", Hr = "_$SOLID_EVENT_OWNER", Ur = Object.prototype.hasOwnProperty, Wr = {}, Gr = /* @__PURE__ */ new Set(), Kr = /* @__PURE__ */ new Map();
function qr(e, t, n, r = {}) {
	let i;
	Xr(t);
	try {
		Or((a) => {
			if (i = a, r.onError && (St()[Oe] = r.onError), t === document) {
				let t = e();
				k(() => fr(t), () => {});
			} else {
				let i = e();
				P(t, () => i, t.firstChild ? null : void 0, n, {
					...r.insertOptions,
					schedule: !0
				});
			}
		}, { id: r.renderId }), Ye();
	} catch (e) {
		throw i && i(), Zr(t), e;
	}
	return () => {
		i(), Zr(t), t.textContent = "";
	};
}
function Jr(e, t, n) {
	let r = document.createElement("template");
	return r.innerHTML = e, n === 2 ? r.content.firstChild.firstChild : r.content.firstChild;
}
function A(e, t) {
	let n;
	return t === 1 ? (r) => document.importNode(n ||= Jr(e, r, t), !0) : (r) => (n ||= Jr(e, r, t)).cloneNode(!0);
}
function Yr(e) {
	for (let t = 0, n = e.length; t < n; t++) {
		let n = e[t];
		Gr.has(n) || (Gr.add(n), Kr.forEach((e, t) => ei(n, t, e)));
	}
}
function Xr(e) {
	let t = Qr(e, e);
	t && (t.roots = (t.roots || 0) + 1);
}
function Zr(e) {
	let t = Kr.get(e);
	t && (t.roots > 1 ? t.roots-- : delete t.roots), $r(e, e);
}
function Qr(e, t = e) {
	if (!e || !t) return;
	let n = Kr.get(e);
	return n || Kr.set(e, n = {
		owners: /* @__PURE__ */ new Map(),
		handlers: /* @__PURE__ */ new Map()
	}), n.owners.set(t, (n.owners.get(t) || 0) + 1), Gr.forEach((t) => ei(t, e, n)), n;
}
function $r(e, t = e) {
	let n = Kr.get(e);
	if (!n) return;
	let r = n.owners.get(t);
	r > 1 ? n.owners.set(t, r - 1) : n.owners.delete(t), !n.owners.size && (n.handlers.forEach((t, n) => e.removeEventListener(n, t)), Kr.delete(e));
}
function ei(e, t, n) {
	if (n.handlers.has(e)) return;
	let r = (e) => pi(e, t, n);
	n.handlers.set(e, r), t.addEventListener(e, r);
}
function ti(e, t) {
	let n = e, r = 0;
	for (; n;) {
		if (t.owners.has(n)) return {
			owner: n,
			distance: r
		};
		r++, n = n._$host || n.parentNode || n.host;
	}
}
var ni = null;
function ri(e) {
	if (ni !== null) for (let t = 0; t < ni.length; t++) ni[t](e);
	return e;
}
function j(e, t, n) {
	if (ui(e)) return;
	let r = t === "multiple" && e.localName === "select";
	if (n == null || n === !1) e.removeAttribute(t);
	else if (e.setAttribute(t, n === !0 ? "" : n), r && !e._$multiple) {
		let t = e.options;
		for (let e = 0; e < t.length; e++) t[e].defaultSelected && (t[e].selected = !0);
	}
	r && (e._$multiple = !0), ni !== null && (t === "href" || t === "action") && ri(e);
}
function M(e, t, n) {
	if (typeof t == "number" && (t = "" + t), typeof n == "number" && (n = "" + n), ui(e)) {
		e._$classes = t && typeof t == "object" ? di(t) : void 0;
		return;
	}
	if (t == null || t === !1) {
		(n || e._$classes) && (e.removeAttribute("class"), e._$classes = void 0);
		return;
	}
	if (typeof t == "string") {
		e._$classes = void 0, t !== n && e.setAttribute("class", t);
		return;
	}
	let r;
	typeof n == "string" ? (r = {}, e.removeAttribute("class")) : r = e._$classes || di(n || {}), t = di(t);
	let i = Object.keys(t), a = Object.keys(r), o, s;
	for (o = 0, s = a.length; o < s; o++) {
		let n = a[o];
		n && n !== "undefined" && !t[n] && e.classList.remove(n);
	}
	for (o = 0, s = i.length; o < s; o++) {
		let n = i[o], a = !!t[n];
		n && n !== "undefined" && r[n] !== a && a && e.classList.add(n);
	}
	e._$classes = t;
}
function ii(e, t, n) {
	if (ui(e)) return;
	if (!t) {
		(n || e._$styles) && (j(e, "style"), e._$styles = void 0);
		return;
	}
	let r = e.style;
	if (typeof t == "string") return e._$styles = void 0, r.cssText = t;
	typeof n == "string" && (r.cssText = "", n = void 0);
	let i = e._$styles;
	i ||= e._$styles = n ? { ...n } : {};
	let a, o;
	for (o in i) (!Ur.call(t, o) || t[o] == null) && (r.removeProperty(o), delete i[o]);
	for (o in t) Ur.call(t, o) && (a = t[o], a != null && a !== i[o] && (r.setProperty(o, a), i[o] = a));
}
function N(e) {
	if (typeof e != "object" || !e) return e;
	if (Array.isArray(e)) return e.map(N);
	if (e[ir] !== e) return e;
	let t = yr(e, 2), n = {};
	for (let r = 0; r < t.length; r++) {
		let i = t[r];
		typeof i == "string" && (n[i] = e[i]);
	}
	return n;
}
function ai(e, t, n) {
	ui(e) || (n == null ? e.style.removeProperty(t) : e.style.setProperty(t, n));
}
function oi(e, t) {
	Array.isArray(e) ? e.flat(Infinity).forEach((e) => e && e(t)) : e(t);
}
function si(e, t) {
	let n = hn(e);
	Wn(null, () => oi(n, t));
}
var ci = { scope: !0 }, li = null;
function P(e, t, n, r, i) {
	let a = n !== void 0, o = i && i.host;
	if (a && !r && (r = []), li !== null && (r = li.claimInitial(e, a, r)), typeof t != "function" && (t = hi(t, r, a, !0), typeof t != "function")) {
		mi(e, t, r, n), o && gi(t, o);
		return;
	}
	if (a && r.length === 0) {
		let t = document.createTextNode("");
		e.insertBefore(t, n), r = [t];
	}
	let s = r;
	k((r) => {
		li !== null && (s = li.reclaimRegion(s, e, n));
		let c = hi(t(), s, a, !0);
		return typeof c == "function" ? (k(() => (li !== null && (s = li.reclaimRegion(s, e, n)), hi(c, s, a)), (t) => {
			s = mi(e, t, s, n), o && gi(s, o);
		}, r !== void 0 && !(i && i.schedule) ? {
			...i,
			schedule: !0
		} : i), Wr) : c;
	}, (t) => {
		t !== Wr && (s = mi(e, t, s, n), o && gi(s, o));
	}, t.$s ? i ? {
		...i,
		scope: !0
	} : ci : i);
}
function ui(e) {
	if (!Pr.hydrating || Pr.isClaiming && !Pr.isClaiming()) return !1;
	if (!e || e.isConnected) return !0;
	let t = Pr.claimRoots;
	if (t) {
		for (let n = 0; n < t.length; n++) if (t[n].contains(e)) return !0;
	}
	return !1;
}
function di(e) {
	if (Array.isArray(e)) {
		let t = {};
		fi(e, t), e = t;
	}
	if (e && typeof e == "object") {
		let t = {}, n = Object.keys(e);
		for (let r = 0, i = n.length; r < i; r++) {
			let i = n[r];
			if (!e[i]) continue;
			let a = i.trim().split(/\s+/);
			for (let e = 0, n = a.length; e < n; e++) a[e] && (t[a[e]] = !0);
		}
		return t;
	}
	return e;
}
function fi(e, t) {
	for (let n = 0, r = e.length; n < r; n++) {
		let r = e[n];
		Array.isArray(r) ? fi(r, t) : typeof r == "object" && r ? Object.assign(t, r) : typeof r != "boolean" && (r || r === 0) && (t[r] = !0);
	}
}
function pi(e, t, n) {
	if (li !== null && li.dedupEvent(e)) return;
	let r = e[Hr], i;
	if (r) {
		if (r === !0 || r === t || !t.contains(r)) return;
		i = r;
	}
	let a = n && (n.owners.size === 1 && n.owners.has(t) ? t : ti(e.target, n)?.owner);
	if (n && !a || a && a === i) return;
	e[Hr] = a || !0;
	let o = i || e.target, s = Vr + e.type, c = e.target, l = a || t || e.currentTarget, u = (t) => Object.defineProperty(e, "target", {
		configurable: !0,
		value: t
	}), d = () => {
		let t = o[s];
		if (t && !o.disabled) {
			let n = o[`${s}Data`];
			if (n === void 0 ? typeof t == "function" ? t.call(o, e) : t.handleEvent(e) : t.call(o, n, e), e.cancelBubble) return;
		}
		return o.host && typeof o.host != "string" && !o.host._$host && o.contains(e.target) && u(o.host), !0;
	}, f = () => {
		for (; o && d() && o !== l && o.parentNode !== l;) o = o._$host || o.parentNode || o.host;
	};
	if (Object.defineProperty(e, "currentTarget", {
		configurable: !0,
		get() {
			return o || l || document;
		}
	}), i) i === e.target && (o = i._$host || i.parentNode || i.host), o && o !== l && f();
	else if (e.composedPath) {
		let t = e.composedPath();
		if (t.length) {
			u(t[0]);
			for (let e = 0; e < t.length && (o = t[e], d()); e++) {
				if (o._$host) {
					o = o._$host, f();
					break;
				}
				if (o === l || o.parentNode === l) break;
			}
		} else f();
	} else f();
	u(c);
}
function mi(e, t, n, r) {
	if (li !== null && ui(e)) {
		if (t && t !== n) {
			let e = Array.isArray(t);
			for (let r of e ? t : [t]) if (r && r.nodeType) {
				if (!ui(r)) return n;
			} else if (e && (typeof r == "string" || typeof r == "number")) return n;
		}
		return t;
	}
	if (t === n) return t;
	let i = typeof t, a = r !== void 0;
	if (i === "string" || i === "number") {
		let r = typeof n;
		r === "string" || r === "number" ? e.firstChild.data = t : vi(e, n) ? e.textContent = t : (yi(e, n), e.insertBefore(document.createTextNode(t), e.firstChild));
	} else if (t === void 0) bi(e, n, r);
	else if (t.nodeType) Array.isArray(n) ? bi(e, n, a ? r : null, t) : n != null && n.nodeType ? n.parentNode === e ? e.replaceChild(t, n) : e.appendChild(t) : n != null && e.firstChild ? e.replaceChild(t, e.firstChild) : e.appendChild(t), r && (t[Fr] = r);
	else if (Array.isArray(t)) {
		let i = Array.isArray(n);
		for (let e = 0, r = t.length; e < r; e++) {
			let r = t[e], a = typeof r;
			if (a === "string" || a === "number") {
				let a = i ? n[e] : void 0;
				a && a.nodeType === 3 ? (a.data !== "" + r && (a.data = r), t[e] = a) : t[e] = document.createTextNode(r);
			}
		}
		t.length === 0 ? bi(e, n, r) : i ? n.length === 0 ? _i(e, t, r) : Br(e, n, t, r) : (n != null && bi(e, n), _i(e, t));
	}
	return t;
}
function hi(e, t, n, r) {
	if (e = fr(e, {
		skipNonRendered: !0,
		doNotUnwrap: r
	}), r && typeof e == "function") return e;
	if (n && !Array.isArray(e) && (e = [e ?? ""]), Pr.hydrating && Array.isArray(e)) for (let n = 0, r = e.length; n < r; n++) {
		let r = e[n], i = t && t[n], a = typeof r;
		(a === "string" || a === "number") && i && i.nodeType === 3 && ui(i) && (e[n] = i);
	}
	return e;
}
function gi(e, t) {
	if (Array.isArray(e)) for (let n = 0, r = e.length; n < r; n++) gi(e[n], t);
	else e && e.nodeType && e[Ir] !== t && (e[Ir] = t, Object.defineProperty(e, "_$host", {
		get: t,
		configurable: !0
	}));
}
function _i(e, t, n = null) {
	for (let r = 0, i = t.length; r < i; r++) {
		let i = t[r];
		e.insertBefore(i, n), n && (i[Fr] = n);
	}
}
function vi(e, t) {
	if (t == null) return !0;
	if (Array.isArray(t)) return t.length ? e.firstChild === t[0] && e.lastChild === t[t.length - 1] : e.firstChild === null;
	if (t === "") return e.firstChild === null;
	if (t.nodeType) return e.firstChild === t && e.lastChild === t;
	let n = e.firstChild;
	return n !== null && n.nodeType === 3 && e.lastChild === n;
}
function yi(e, t) {
	if (Array.isArray(t)) for (let n = 0; n < t.length; n++) {
		let r = t[n];
		r.parentNode === e && r.remove();
	}
	else if (t.nodeType) t.parentNode === e && t.remove();
	else {
		let t = e.firstChild;
		t && t.nodeType === 3 && t.remove();
	}
}
function bi(e, t, n, r) {
	if (n === void 0) return vi(e, t) ? e.textContent = "" : yi(e, t);
	if (t.length) {
		let i = !1;
		for (let a = t.length - 1; a >= 0; a--) {
			let o = t[a];
			if (r !== o) {
				let t = o[Fr], s = o.parentNode === e && (!t || t === n);
				r && !i && !a ? s ? e.replaceChild(r, o) : e.insertBefore(r, n) : s && o.remove();
			} else i = !0;
		}
	} else r && e.insertBefore(r, n);
	r && n && (r[Fr] = n);
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/Pipeable.js
var xi = (e, t) => {
	switch (t.length) {
		case 0: return e;
		case 1: return t[0](e);
		case 2: return t[1](t[0](e));
		case 3: return t[2](t[1](t[0](e)));
		case 4: return t[3](t[2](t[1](t[0](e))));
		case 5: return t[4](t[3](t[2](t[1](t[0](e)))));
		case 6: return t[5](t[4](t[3](t[2](t[1](t[0](e))))));
		case 7: return t[6](t[5](t[4](t[3](t[2](t[1](t[0](e)))))));
		case 8: return t[7](t[6](t[5](t[4](t[3](t[2](t[1](t[0](e))))))));
		case 9: return t[8](t[7](t[6](t[5](t[4](t[3](t[2](t[1](t[0](e)))))))));
		default: {
			let n = e;
			for (let e = 0, r = t.length; e < r; e++) n = t[e](n);
			return n;
		}
	}
}, Si = { pipe() {
	return xi(this, arguments);
} }, Ci = /*#__PURE__*/ function() {
	function e() {}
	return e.prototype = Si, e;
}(), F = function(e, t) {
	if (typeof e == "function") return function() {
		return e(arguments) ? t.apply(this, arguments) : (e) => t(e, ...arguments);
	};
	switch (e) {
		case 0:
		case 1: throw RangeError(`Invalid arity ${e}`);
		case 2: return function(e, n) {
			return arguments.length >= 2 ? t(e, n) : function(n) {
				return t(n, e);
			};
		};
		case 3: return function(e, n, r) {
			return arguments.length >= 3 ? t(e, n, r) : function(r) {
				return t(r, e, n);
			};
		};
		default: return function() {
			if (arguments.length >= e) return t.apply(this, arguments);
			let n = arguments;
			return function(e) {
				return t(e, ...n);
			};
		};
	}
}, I = (e) => e, wi = (e) => () => e, Ti = /*#__PURE__*/ wi(!0), Ei = /*#__PURE__*/ wi(!1), Di = /*#__PURE__*/ wi(void 0), Oi = Di;
function ki(e) {
	let t = /* @__PURE__ */ new WeakMap();
	return (n) => {
		let r = t.get(n);
		if (r !== void 0) return r;
		let i = e(n);
		return t.set(n, i), i;
	};
}
function Ai(e) {
	let t = /* @__PURE__ */ new WeakMap();
	return (n) => {
		let r = t.get(n);
		if (r !== void 0) return r;
		let i = e(n);
		return t.set(n, i), i !== n && t.set(i, i), i;
	};
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/internal/equal.js
var ji = (e) => {
	let t = new Set(Reflect.ownKeys(e));
	if (e.constructor === Object) return t;
	e instanceof Error && t.delete("stack");
	let n = Object.getPrototypeOf(e), r = n;
	for (; r !== null && r !== Object.prototype;) {
		let e = Reflect.ownKeys(r);
		for (let n = 0; n < e.length; n++) t.add(e[n]);
		r = Object.getPrototypeOf(r);
	}
	return t.has("constructor") && typeof e.constructor == "function" && n === e.constructor.prototype && t.delete("constructor"), t;
}, Mi = /*#__PURE__*/ new WeakSet(), Ni = (e) => new Uint8Array(e.buffer, e.byteOffset, e.byteLength), Pi = 0, Fi = () => {
	Pi++;
};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/Predicate.js
function Ii(e) {
	return typeof e == "string";
}
function Li(e) {
	return typeof e == "number";
}
function Ri(e) {
	return typeof e == "symbol";
}
function zi(e) {
	return Ii(e) || Li(e) || Ri(e);
}
function Bi(e) {
	return typeof e == "function";
}
function Vi(e) {
	return e != null;
}
function Hi(e) {
	return !0;
}
function Ui(e) {
	return typeof e == "object" && !!e || Bi(e);
}
var L = /*#__PURE__*/ F(2, (e, t) => Ui(e) && t in e), Wi = /*#__PURE__*/ F(2, (e, t) => L(e, "_tag") && e._tag === t), Gi = "~effect/Hash", R = (e) => {
	switch (typeof e) {
		case "number": return Zi(e);
		case "bigint": return Qi(e.toString(10));
		case "string": return Qi(e);
		case "function":
		case "object":
			if (e === null) break;
			if (e instanceof Date) return Number.isNaN(e.getTime()) ? Qi("Invalid Date") : Qi(e.toISOString());
			if (e instanceof RegExp) return Qi(e.toString());
			{
				if (Mi.has(e)) return Ki(e);
				let t = sa.get(e);
				if (t !== void 0) return t;
				if (ca.has(e)) return Fi(), Qi("[Circular]");
				ca.add(e);
				let n = Pi, r;
				try {
					r = "~effect/Hash" in e ? e[Gi]() : typeof e == "function" ? Ki(e) : e instanceof DataView ? na(Ni(e)) : Array.isArray(e) || ArrayBuffer.isView(e) ? na(e) : e instanceof Map ? ra(e) : e instanceof Set ? aa(e) : ea(e);
				} finally {
					ca.delete(e);
				}
				return n === Pi && sa.set(e, r), r;
			}
	}
	return Yi(qi(Qi(String(e))));
}, Ki = (e) => (oa.has(e) || oa.set(e, Yi(Math.random() * 4294967296 | 0)), oa.get(e)), qi = (e) => (e ^= e >>> 16, e = Math.imul(e, 2246822507), e ^= e >>> 13, e = Math.imul(e, 3266489909), e ^ e >>> 16), Ji = /*#__PURE__*/ F(2, (e, t) => qi(Math.imul(e, 2654435761) + Math.imul(t, 2246822507))), Yi = (e) => e & 3221225471 | e >>> 1 & 1073741824, Xi = /*#__PURE__*/ new DataView(/*#__PURE__*/ new ArrayBuffer(8)), Zi = (e) => {
	let t = e | 0;
	return t === e ? Yi(t) : (Xi.setFloat64(0, e === e ? e : NaN), Yi(Ji(Xi.getInt32(0), Xi.getInt32(4))));
}, Qi = (e) => {
	let t = 5381, n = e.length;
	for (; n;) t = t * 33 ^ e.charCodeAt(--n);
	return Yi(t);
}, $i = (e, t) => {
	let n = 12289;
	for (let r of t) n ^= Ji(R(r), R(e[r]));
	return Yi(n);
}, ea = (e) => $i(e, ji(e)), ta = (e, t) => (n) => {
	let r = e;
	for (let e of n) r ^= t(e);
	return Yi(r);
}, na = (e) => {
	let t = 6151;
	for (let n of e) t = Ji(t, R(n));
	return Yi(t);
}, ra = /*#__PURE__*/ ta(/*#__PURE__*/ Qi("Map"), ([e, t]) => Ji(R(e), R(t))), ia = /*#__PURE__*/ Qi("Set"), aa = /*#__PURE__*/ ta(ia, (e) => Ji(ia, R(e))), oa = /*#__PURE__*/ new WeakMap(), sa = /*#__PURE__*/ new WeakMap(), ca = /*#__PURE__*/ new WeakSet(), la = "~effect/Equal";
function ua() {
	return arguments.length === 1 ? (e) => da(e, arguments[0]) : da(arguments[0], arguments[1]);
}
function da(e, t) {
	if (e === t) return !0;
	if (e == null || t == null) return !1;
	let n = typeof e;
	return n === typeof t ? n === "number" && e !== e && t !== t ? !0 : n !== "object" && n !== "function" || Mi.has(e) || Mi.has(t) ? !1 : fa(e, t) : !1;
}
function fa(e, t) {
	let n = ma.length;
	for (let r = n; r-- > 0;) if (ma[r] === e && ha[r] === t) return !0;
	if (n) return pa(e, t);
	let r = ga.get(e);
	r || ga.set(e, r = /* @__PURE__ */ new WeakMap());
	let i = r.get(t);
	return i === void 0 && r.set(t, i = pa(e, t)), i;
}
function pa(e, t) {
	ma.push(e), ha.push(t);
	try {
		return _a(e, t);
	} finally {
		ma.pop(), ha.pop();
	}
}
var ma = [], ha = [], ga = /*#__PURE__*/ new WeakMap();
function _a(e, t) {
	if (R(e) !== R(t)) return !1;
	if (e instanceof Date) {
		if (!(t instanceof Date)) return !1;
		let n = e.getTime(), r = t.getTime();
		return n === r || Number.isNaN(n) && Number.isNaN(r);
	}
	if (e instanceof RegExp) return t instanceof RegExp && e.toString() === t.toString();
	let n = wa(e);
	if (n !== wa(t) || typeof e == "function" && !n) return !1;
	if (n) return e[la](t);
	if (Array.isArray(e)) return !Array.isArray(t) || e.length !== t.length ? !1 : va(e, t);
	if (ArrayBuffer.isView(e)) {
		let n = e instanceof DataView;
		return !ArrayBuffer.isView(t) || e.byteLength !== t.byteLength || n !== t instanceof DataView ? !1 : n ? ya(Ni(e), Ni(t)) : ya(e, t);
	}
	return e instanceof Map ? !(t instanceof Map) || e.size !== t.size ? !1 : xa(e, t, Sa, Ca) : e instanceof Set ? !(t instanceof Set) || e.size !== t.size ? !1 : xa(e, t, R, da) : ba(e, t);
}
function va(e, t) {
	for (let n = 0; n < e.length; n++) if (!da(e[n], t[n])) return !1;
	return !0;
}
function ya(e, t) {
	if (e.length !== t.length) return !1;
	for (let n = 0; n < e.length; n++) if (e[n] !== t[n]) return !1;
	return !0;
}
function ba(e, t) {
	let n = ji(e), r = ji(t);
	if (n.size !== r.size) return !1;
	for (let i of n) if (!r.has(i) || !da(e[i], t[i])) return !1;
	return !0;
}
function xa(e, t, n, r) {
	let i = /* @__PURE__ */ new Map();
	for (let e of t) {
		let t = n(e), r = i.get(t);
		r ? r.push(e) : i.set(t, [e]);
	}
	outer: for (let t of e) {
		let e = i.get(n(t));
		if (e) {
			for (let n = 0; n < e.length; n++) if (r(t, e[n])) {
				e[n] = e[e.length - 1], e.pop();
				continue outer;
			}
		}
		return !1;
	}
	return !0;
}
var Sa = (e) => R(e[0]), Ca = (e, t) => da(e[0], t[0]) && da(e[1], t[1]), wa = (e) => L(e, la), Ta = /*#__PURE__*/ Symbol.for("~effect/Redactable"), Ea = (e) => L(e, Ta);
function Da(e) {
	return Ea(e) ? Oa(e) : e;
}
function Oa(e) {
	return e[Ta](globalThis["~effect/Fiber/currentFiber"]?.context ?? ja);
}
var ka = "~effect/Fiber/currentFiber", Aa = /*#__PURE__*/ new Map(), ja = {
	"~effect/Context": {},
	base: Aa,
	depth: 0,
	mapUnsafe: Aa,
	pipe() {
		return xi(this, arguments);
	}
};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/Formatter.js
function Ma(e, t) {
	let n = t?.space ?? 0, r = /* @__PURE__ */ new WeakSet(), i = n ? typeof n == "number" ? " ".repeat(n) : n : "", a = (e) => i.repeat(e), o = (e, t) => {
		let n = e?.constructor;
		return n && n !== Object.prototype.constructor && n.name ? `${n.name}(${t})` : t;
	}, s = (e) => {
		try {
			return Reflect.ownKeys(e);
		} catch {
			return ["[ownKeys threw]"];
		}
	};
	function c(e, t = 0) {
		try {
			return l(e, t);
		} catch {
			return (typeof e == "object" && e || typeof e == "function") && r.delete(e), "[inspection threw]";
		}
	}
	function l(e, n = 0) {
		if (typeof e == "string") return JSON.stringify(e);
		if (typeof e == "number" || e == null || typeof e == "boolean" || typeof e == "symbol") return String(e);
		if (typeof e == "bigint") return String(e) + "n";
		if (typeof e == "object" || typeof e == "function") {
			if (r.has(e)) return Na;
			r.add(e);
			let l;
			if (Ta in e) l = c(Oa(e), n);
			else if (Array.isArray(e)) l = !i || e.length <= 1 ? `[${e.map((e) => c(e, n)).join(",")}]` : `[\n${a(n + 1)}${e.map((e) => c(e, n + 1)).join(",\n" + a(n + 1))}\n${a(n)}]`;
			else if (e instanceof Date) l = Ia(e);
			else if (!t?.ignoreToString && L(e, "toString") && typeof e.toString == "function" && e.toString !== Object.prototype.toString && e.toString !== Array.prototype.toString) {
				let t = La(e);
				l = e instanceof Error && e.cause !== void 0 ? `${t} (cause: ${c(e.cause, n)})` : t;
			} else if (Symbol.iterator in e) l = `${e.constructor.name}(${c(Array.from(e), n)})`;
			else {
				let t = s(e);
				if (!i || t.length <= 1) {
					let r = `{${t.map((t) => `${Pa(t)}:${c(Ra(e, t), n)}`).join(",")}}`;
					l = o(e, r);
				} else {
					let r = `{\n${t.map((t) => `${a(n + 1)}${Pa(t)}: ${c(Ra(e, t), n + 1)}`).join(",\n")}\n${a(n)}}`;
					l = o(e, r);
				}
			}
			return r.delete(e), l;
		}
		return String(e);
	}
	return c(e, 0);
}
var Na = "[Circular]";
function Pa(e) {
	return typeof e == "string" ? JSON.stringify(e) : String(e);
}
function Fa(e) {
	return e.map((e) => `[${Pa(e)}]`).join("");
}
function Ia(e) {
	try {
		return e.toISOString();
	} catch {
		return "Invalid Date";
	}
}
function La(e) {
	try {
		let t = e.toString();
		return typeof t == "string" ? t : String(t);
	} catch {
		return "[toString threw]";
	}
}
function Ra(e, t) {
	try {
		return e[t];
	} catch {
		return "[property access threw]";
	}
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/Inspectable.js
var za = /*#__PURE__*/ Symbol.for("nodejs.util.inspect.custom"), Ba = (e) => {
	try {
		return e = Da(e), L(e, "toJSON") && Bi(e.toJSON) && e.toJSON.length === 0 ? e.toJSON() : Array.isArray(e) ? e.map(Ba) : e;
	} catch {
		return "[toJSON threw]";
	}
}, Va = {
	toJSON() {
		return Ba(this);
	},
	[za]() {
		return this.toJSON();
	},
	toString() {
		return Ma(this.toJSON());
	}
}, Ha = /*#__PURE__*/ (() => {
	let e = Object.getOwnPropertyDescriptor(Error, "stackTraceLimit");
	return e === void 0 ? Object.isExtensible(Error) : Object.hasOwn(e, "writable") ? e.writable === !0 : e.set !== void 0;
})(), Ua = () => Error.stackTraceLimit, Wa = (e) => {
	Ha && (Error.stackTraceLimit = e);
}, Ga = class {
	constructor(e) {
		this.value = e, this.done = !1;
	}
	next(e) {
		return this.done ? (this.value = e, this) : (this.done = !0, {
			value: this.value,
			done: !1
		});
	}
}, Ka = /*#__PURE__*/ (() => {
	let e = "~effect/Utils/internal", t = { [e]: (e) => e() }, n = { [e]: (e) => {
		try {
			return e();
		} finally {}
	} };
	return Ua() !== 0 && t[e](() => (/* @__PURE__ */ Error()).stack)?.includes(e) === !0 ? t[e] : n[e];
})();
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/internal/record.js
function qa(e, t, n) {
	t === "__proto__" ? Object.defineProperty(e, t, {
		value: n,
		writable: !0,
		enumerable: !0,
		configurable: !0
	}) : e[t] = n;
}
function Ja(e, t) {
	for (let n of Reflect.ownKeys(t)) Object.prototype.propertyIsEnumerable.call(t, n) && qa(e, n, t[n]);
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/internal/core.js
var Ya = "~effect/Effect", Xa = "~effect/Exit", Za = {
	_A: I,
	_E: I,
	_R: I
}, Qa = `${Ya}/identifier`, z = `${Ya}/args`, B = `${Ya}/evaluate`, $a = `${Ya}/successCont`, eo = `${Ya}/failureCont`, to = `${Ya}/ensureCont`, no = /*#__PURE__*/ Symbol.for("effect/Effect/Yield"), ro = {
	pipe() {
		return xi(this, arguments);
	},
	toJSON() {
		return { ...this };
	},
	toString() {
		return Ma(this.toJSON(), {
			ignoreToString: !0,
			space: 2
		});
	},
	[za]() {
		return this.toJSON();
	}
}, io = {
	[Ya]: Za,
	...ro,
	[Symbol.iterator]() {
		return new Ga(this);
	},
	toJSON() {
		return {
			_id: "Effect",
			op: this[Qa],
			...z in this ? { args: this[z] } : void 0
		};
	}
}, ao = (e) => L(e, Ya), oo = (e) => L(e, Xa), so = "~effect/Cause", co = "~effect/Cause/Reason", lo = (e) => L(e, so), uo = class {
	constructor(e) {
		this[so] = so, this.reasons = e;
	}
	pipe() {
		return xi(this, arguments);
	}
	toJSON() {
		return {
			_id: "Cause",
			failures: this.reasons.map((e) => e.toJSON())
		};
	}
	toString() {
		return `Cause(${Ma(this.reasons)})`;
	}
	[za]() {
		return this.toJSON();
	}
	[la](e) {
		return lo(e) && this.reasons.length === e.reasons.length && this.reasons.every((t, n) => ua(t, e.reasons[n]));
	}
	[Gi]() {
		return na(this.reasons);
	}
}, fo = /*#__PURE__*/ new WeakMap(), po = class {
	[co];
	annotations;
	_tag;
	constructor(e, t, n) {
		if (this[co] = co, this._tag = e, t !== mo && typeof n == "object" && n && t.size > 0) {
			let e = fo.get(n);
			e && (t = new Map([...e, ...t])), fo.set(n, t);
		}
		this.annotations = t;
	}
	annotate(e, t) {
		if (e.mapUnsafe.size === 0) return this;
		let n = new Map(this.annotations);
		e.mapUnsafe.forEach((e, r) => {
			t?.overwrite !== !0 && n.has(r) || n.set(r, e);
		});
		let r = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
		return r.annotations = n, r;
	}
	pipe() {
		return xi(this, arguments);
	}
	toString() {
		return Ma(this);
	}
	[za]() {
		return this.toString();
	}
}, mo = /*#__PURE__*/ new Map(), ho = class extends po {
	constructor(e, t = mo) {
		super("Fail", t, e), this.error = e;
	}
	toString() {
		return `Fail(${Ma(this.error)})`;
	}
	toJSON() {
		return {
			_tag: "Fail",
			error: this.error
		};
	}
	[la](e) {
		return xo(e) && ua(this.error, e.error) && ua(this.annotations, e.annotations);
	}
	[Gi]() {
		return Ji(Qi(this._tag))(Ji(R(this.error))(R(this.annotations)));
	}
}, go = (e) => new uo(e), _o = (e) => new uo([new ho(e)]), vo = class extends po {
	constructor(e, t = mo) {
		super("Die", t, e), this.defect = e;
	}
	toString() {
		return `Die(${Ma(this.defect)})`;
	}
	toJSON() {
		return {
			_tag: "Die",
			defect: this.defect
		};
	}
	[la](e) {
		return So(e) && ua(this.defect, e.defect) && ua(this.annotations, e.annotations);
	}
	[Gi]() {
		return Ji(Qi(this._tag))(Ji(R(this.defect))(R(this.annotations)));
	}
}, yo = (e) => new uo([new vo(e)]), bo = /*#__PURE__*/ F((e) => lo(e[0]), (e, t, n) => t.mapUnsafe.size === 0 ? e : new uo(e.reasons.map((e) => e.annotate(t, n)))), xo = (e) => e._tag === "Fail", So = (e) => e._tag === "Die", Co = (e) => e._tag === "Interrupt";
function wo(e) {
	return Mo("Effect.evaluate: Not implemented");
}
var To = (e) => ({
	...io,
	[Qa]: e.op,
	[B]: e[B] ?? wo,
	[$a]: e[$a],
	[eo]: e[eo],
	[to]: e[to]
}), Eo = (e) => {
	let t = To(e), n = function(e) {
		this[z] = e;
	};
	return n.prototype = t, function(e) {
		return new n(e);
	};
}, Do = (e) => {
	let t = {
		[Xa]: Xa,
		_tag: e.op,
		get [e.prop]() {
			return this[z];
		},
		...To(e),
		toString() {
			return `${e.op}(${Ma(this[z])})`;
		},
		toJSON() {
			return {
				_id: "Exit",
				_tag: e.op,
				[e.prop]: this[z]
			};
		},
		[la](e) {
			return oo(e) && e._tag === this._tag && ua(this[z], e[z]);
		},
		[Gi]() {
			return Ji(Qi(e.op), R(this[z]));
		}
	}, n = function(e) {
		this[z] = e;
	};
	return n.prototype = t, function(e) {
		return new n(e);
	};
}, V = /*#__PURE__*/ Do({
	op: "Success",
	prop: "value",
	[B](e) {
		let t = e.getCont($a);
		return t ? t[$a](this[z], e, this) : e.yieldWith(this);
	}
}), Oo = { key: "effect/Cause/StackTrace" }, ko = { key: "effect/Cause/InterruptorStackTrace" }, Ao = /*#__PURE__*/ Do({
	op: "Failure",
	prop: "cause",
	[B](e) {
		let t = this[z], n = !1;
		e.cache.stackFrame && (t = bo(t, { mapUnsafe: /* @__PURE__ */ new Map([[Oo.key, e.cache.stackFrame]]) }), n = !0);
		let r = e.getCont(eo);
		for (; e.interruptible && e._interruptedCause && r;) r = e.getCont(eo);
		return r ? r[eo](t, e, n ? void 0 : this) : e.yieldWith(n ? Ao(t) : this);
	}
}), jo = (e) => Ao(_o(e)), Mo = (e) => Ao(yo(e)), H = /*#__PURE__*/ Eo({
	op: "WithFiber",
	[B](e) {
		return this[z](e);
	}
}), No = /*#__PURE__*/ function() {
	class e extends globalThis.Error {}
	let t = /*#__PURE__*/ To({
		op: "YieldableError",
		[B]() {
			return jo(this);
		}
	});
	return delete t.toString, Object.assign(e.prototype, t), e;
}(), Po = /*#__PURE__*/ function() {
	let e = /*#__PURE__*/ Symbol.for("effect/Data/Error/plainArgs");
	return class extends No {
		constructor(t) {
			super(t?.message, t?.cause ? { cause: t.cause } : void 0), t && (Ja(this, t), Object.defineProperty(this, e, {
				value: t,
				enumerable: !1
			}));
		}
		toJSON() {
			return {
				...this[e],
				...this
			};
		}
	};
}(), Fo = (e) => {
	class t extends Po {
		_tag = e;
	}
	return t.prototype.name = e, t;
}, Io = "~effect/Cause/Done", Lo = (e) => L(e, Io), Ro = {
	[Io]: Io,
	_tag: "Done",
	value: void 0
}, zo = (e) => e === void 0 ? Ro : {
	[Io]: Io,
	_tag: "Done",
	value: e
}, Bo = /*#__PURE__*/ jo(Ro), Vo = (e) => e === void 0 ? Bo : jo(zo(e)), Ho = (e) => To({
	op: e.label,
	[B]: e.evaluate
}), Uo = "~effect/Option", Wo = {
	[Uo]: { _A: (e) => e },
	...ro,
	[Symbol.iterator]() {
		return new Ga(this);
	}
}, Go = /*#__PURE__*/ Object.defineProperty(/*#__PURE__*/ Object.assign(/*#__PURE__*/ Object.create(Wo), {
	_tag: "Some",
	_op: "Some",
	[la](e) {
		return Jo(e) && Xo(e) && ua(this.value, e.value);
	},
	[Gi]() {
		return Ji(R(this._tag))(R(this.value));
	},
	toString() {
		return `some(${Ma(this.value)})`;
	},
	toJSON() {
		return {
			_id: "Option",
			_tag: this._tag,
			value: Ba(this.value)
		};
	}
}), "valueOrUndefined", { get() {
	return this.value;
} }), Ko = /*#__PURE__*/ R("None"), qo = /*#__PURE__*/ Object.assign(/*#__PURE__*/ Object.create(Wo), {
	_tag: "None",
	_op: "None",
	valueOrUndefined: void 0,
	[la](e) {
		return Jo(e) && Yo(e);
	},
	[Gi]() {
		return Ko;
	},
	toString() {
		return "none()";
	},
	toJSON() {
		return {
			_id: "Option",
			_tag: this._tag
		};
	}
}), Jo = (e) => L(e, Uo), Yo = (e) => e._tag === "None", Xo = (e) => e._tag === "Some", Zo = /*#__PURE__*/ Object.create(qo), Qo = function(e) {
	this.value = e;
};
Qo.prototype = Go;
var $o = (e) => new Qo(e), es = "~effect/Result", ts = {
	[es]: {
		/* v8 ignore next 2 */
		_A: (e) => e,
		_E: (e) => e
	},
	...ro,
	[Symbol.iterator]() {
		return new Ga(this);
	}
}, ns = /*#__PURE__*/ Object.assign(/*#__PURE__*/ Object.create(ts), {
	_tag: "Success",
	_op: "Success",
	[la](e) {
		return is(e) && os(e) && ua(this.success, e.success);
	},
	[Gi]() {
		return Ji(R(this._tag))(R(this.success));
	},
	toString() {
		return `success(${Ma(this.success)})`;
	},
	toJSON() {
		return {
			_id: "Result",
			_tag: this._tag,
			value: Ba(this.success)
		};
	}
}), rs = /*#__PURE__*/ Object.assign(/*#__PURE__*/ Object.create(ts), {
	_tag: "Failure",
	_op: "Failure",
	[la](e) {
		return is(e) && as(e) && ua(this.failure, e.failure);
	},
	[Gi]() {
		return Ji(R(this._tag))(R(this.failure));
	},
	toString() {
		return `failure(${Ma(this.failure)})`;
	},
	toJSON() {
		return {
			_id: "Result",
			_tag: this._tag,
			failure: Ba(this.failure)
		};
	}
}), is = (e) => L(e, es), as = (e) => e._tag === "Failure", os = (e) => e._tag === "Success", ss = function(e) {
	this.failure = e;
};
ss.prototype = rs;
var cs = (e) => new ss(e), ls = function(e) {
	this.success = e;
};
ls.prototype = ns;
var us = (e) => new ls(e);
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/Order.js
function ds(e) {
	return (t, n) => t === n ? 0 : e(t, n);
}
var fs = /*#__PURE__*/ ds((e, t) => e < t ? -1 : 1), ps = /*#__PURE__*/ ds((e, t) => globalThis.Number.isNaN(e) && globalThis.Number.isNaN(t) ? 0 : globalThis.Number.isNaN(e) ? -1 : globalThis.Number.isNaN(t) ? 1 : e < t ? -1 : 1), ms = /*#__PURE__*/ F(2, (e, t) => ds((n, r) => e(t(n), t(r)))), hs = (e) => F(2, (t, n) => e(t, n) === 1), gs = () => Zo, _s = $o, vs = Yo, ys = Xo, bs = /*#__PURE__*/ (/* @__PURE__ */ F(2, (e, t) => vs(e) ? t() : e.value))(Di), xs = "~effect/Context/Service", Ss = function() {
	function e() {}
	let t = e;
	Object.setPrototypeOf(t, Cs);
	let n = (e, n) => (t.key = e, n?.defaultValue && (t[Ts] = Ts, t.defaultValue = n.defaultValue), n?.make && (t.make = n.make), n?.fiberCached && ws.add(e), t);
	return arguments.length > 0 ? n(arguments[0], arguments[1]) : n;
}, Cs = {
	[xs]: xs,
	.../*#__PURE__*/ Ho({
		label: "Service",
		evaluate(e) {
			return V(Js(e.context, this));
		}
	}),
	toJSON() {
		return {
			_id: "Service",
			key: this.key
		};
	},
	of(e) {
		return e;
	},
	context(e) {
		return Hs(this, e);
	},
	use(e) {
		return H((t) => e(Js(t.context, this)));
	},
	useSync(e) {
		return H((t) => V(e(Js(t.context, this))));
	}
}, ws = /*#__PURE__*/ new Set(), Ts = "~effect/Context/Reference", Es = "~effect/Context", Ds = 8, Os = 8, ks = (e, t, n, r) => {
	let i = Object.create(Is);
	return i.cacheRoot = e ?? i, i.base = t, i.overlay = n, i.depth = r, i._flat = void 0, i.baseHits = 0, i;
}, As = (e, t) => {
	t && (As(e, t.parent), e.set(t.key, t.value));
}, js = (e) => {
	if (e._flat) return e._flat;
	if (!e.overlay) return e._flat = e.base;
	let t = new Map(e.base);
	return As(t, e.overlay), e._flat = t;
}, Ms = (e, t) => {
	let n = new Map(e.mapUnsafe);
	return t(n), Fs(n);
}, Ns = /*#__PURE__*/ Symbol(), Ps = (e, t) => {
	let n = e;
	for (let e = n.overlay; e; e = e.parent) if (e.key === t) return e.value;
	let r = n.base.get(t);
	return r === void 0 && !n.base.has(t) ? Ns : (n.overlay && ++n.baseHits >= n.base.size && n.baseHits >= Os && (n.base = js(n), n.overlay = void 0, n.depth = 0), r);
}, Fs = (e) => ks(void 0, e, void 0, 0), Is = {
	get mapUnsafe() {
		return js(this);
	},
	...ro,
	[Es]: { _Services: (e) => e },
	toJSON() {
		return {
			_id: "Context",
			services: Array.from(this.mapUnsafe).map(([e, t]) => ({
				key: e,
				value: t
			}))
		};
	},
	[la](e) {
		if (!Rs(e)) return !1;
		let t = this.mapUnsafe, n = e.mapUnsafe;
		if (t.size !== n.size) return !1;
		for (let [e, r] of t) if (!n.has(e) || !ua(r, n.get(e))) return !1;
		return !0;
	},
	[Gi]() {
		return Zi(this.mapUnsafe.size);
	}
}, Ls = (e, t) => e.cacheRoot === t.cacheRoot, Rs = (e) => L(e, Es), zs = (e) => !!e[Ts], Bs = () => Vs, Vs = /*#__PURE__*/ Fs(/*#__PURE__*/ new Map()), Hs = (e, t) => Fs(/* @__PURE__ */ new Map([[e.key, t]])), Us = /*#__PURE__*/ F(3, (e, t, n) => Ws(e, t.key, n)), Ws = (e, t, n) => {
	let r = e, i = ws.has(t) ? void 0 : r.cacheRoot;
	if (r.depth >= Ds) {
		let e = new Map(r.mapUnsafe);
		return e.set(t, n), ks(i, e, void 0, 0);
	}
	return ks(i, r.base, {
		key: t,
		value: n,
		parent: r.overlay
	}, r.depth + 1);
}, Gs = /*#__PURE__*/ F(2, (e, t) => Ks(e, t.key)), Ks = (e, t) => {
	let n = Ps(e, t);
	return n === Ns ? void 0 : n;
}, qs = /*#__PURE__*/ F(2, (e, t) => {
	let n = Ps(e, t.key);
	if (n === Ns) {
		if (zs(t)) return Xs(t);
		throw Zs(t);
	}
	return n;
}), Js = qs, Ys = "~effect/Context/defaultValue", Xs = (e) => Ys in e ? e[Ys] : e[Ys] = e.defaultValue(), Zs = (e) => {
	let t = /* @__PURE__ */ Error(`Service not found${e.key ? `: ${String(e.key)}` : ""}`);
	if (t.stack) {
		let e = t.stack.split("\n");
		e.splice(1, 3), t.stack = e.join("\n");
	}
	return t;
}, Qs = /*#__PURE__*/ F(2, (e, t) => e.mapUnsafe.size === 0 ? t : t.mapUnsafe.size === 0 ? e : Ms(e, (e) => t.mapUnsafe.forEach((t, n) => e.set(n, t)))), $s = (...e) => {
	let t = /* @__PURE__ */ new Map();
	for (let n = 0; n < e.length; n++) e[n].mapUnsafe.forEach((e, n) => {
		t.set(n, e);
	});
	return Fs(t);
}, ec = Ss, tc = (e) => e.length > 0, nc = (e) => e > 0 ? Math.floor(e) : 0, rc = us, ic = cs, ac = (e) => {
	if (Bi(e)) try {
		return rc(e());
	} catch (e) {
		return ic(e);
	}
	try {
		return rc(e.try());
	} catch (t) {
		return ic(e.catch(t));
	}
}, oc = as, sc = /*#__PURE__*/ F(2, (e, t) => oc(e) ? t(e.failure) : e.success), cc = /*#__PURE__*/ sc(Di), lc = globalThis.Array, uc = (e) => lc.isArray(e) ? e : lc.from(e), dc = /*#__PURE__*/ F(2, (e, t) => [...e, t]);
lc.isArray;
var fc = tc, pc = tc, mc = (e) => e[e.length - 1], hc = () => [], gc = (e) => [e], _c = /*#__PURE__*/ F(2, (e, t) => e.map(t)), vc = "~effect/Duration", yc = /*#__PURE__*/ BigInt(0), bc = /*#__PURE__*/ BigInt(1), xc = /*#__PURE__*/ BigInt(2), Sc = /*#__PURE__*/ BigInt(10), Cc = /*#__PURE__*/ BigInt(1e3), wc = (e) => BigInt(e < 0 ? Math.ceil(e - .5) : Math.floor(e + .5)), Tc = (e) => wc(e * 1e6), Ec = (e, t) => {
	let n = e.indexOf(".");
	if (n === -1) return BigInt(e) * t;
	let r = e[0] === "-", i = e.slice(n + 1), a = Sc ** BigInt(i.length), o = (BigInt(e.slice(+!!r, n)) * a + BigInt(i)) * t, s = o / a + (o % a * xc >= a ? bc : yc);
	return r ? -s : s;
}, Dc = /^(-?\d+(?:\.\d+)?)\s+(nanos?|micros?|millis?|seconds?|minutes?|hours?|days?|weeks?)$/, Oc = (e) => {
	switch (typeof e) {
		case "number": return Bc(e);
		case "bigint": return zc(e);
		case "string": {
			if (e === "Infinity") return Lc;
			if (e === "-Infinity") return Rc;
			let t = Dc.exec(e);
			if (!t) break;
			let [n, r, i] = t;
			if (i === "nano" || i === "nanos") return zc(Ec(r, bc));
			if (i === "micro" || i === "micros") return zc(Ec(r, Cc));
			let a = Number(r);
			switch (i) {
				case "milli":
				case "millis": return Bc(a);
				case "second":
				case "seconds": return Vc(a);
				case "minute":
				case "minutes": return Hc(a);
				case "hour":
				case "hours": return Uc(a);
				case "day":
				case "days": return Wc(a);
				case "week":
				case "weeks": return Gc(a);
			}
			break;
		}
		case "object": {
			if (e === null) break;
			if (vc in e) return e;
			if (Array.isArray(e)) return e.length !== 2 || !e.every(Li) ? kc(e) : Number.isNaN(e[0]) || Number.isNaN(e[1]) ? Ic : e[0] === -Infinity || e[1] === -Infinity ? Rc : e[0] === Infinity || e[1] === Infinity ? Lc : Pc(wc(e[0] * 1e9 + e[1]));
			let t = e, n = 0;
			return t.weeks && (n += t.weeks * 6048e5), t.days && (n += t.days * 864e5), t.hours && (n += t.hours * 36e5), t.minutes && (n += t.minutes * 6e4), t.seconds && (n += t.seconds * 1e3), t.milliseconds && (n += t.milliseconds), !t.microseconds && !t.nanoseconds ? Pc(n) : Pc(wc(n * 1e6 + (t.microseconds ?? 0) * 1e3 + (t.nanoseconds ?? 0)));
		}
	}
	return kc(e);
}, kc = (e) => {
	throw Error(`Invalid Input: ${e}`);
}, Ac = {
	_tag: "Millis",
	millis: 0
}, jc = { _tag: "Infinity" }, Mc = { _tag: "NegativeInfinity" }, Nc = {
	[vc]: vc,
	[Gi]() {
		switch (this.value._tag) {
			case "Millis": {
				let e = this.value.millis * 1e6;
				return Number.isFinite(e) ? R(wc(e)) : Zi(this.value.millis);
			}
			case "Nanos": return R(this.value.nanos);
			default: return ea(this.value);
		}
	},
	[la](e) {
		return Fc(e) && Zc(this, e);
	},
	toString() {
		switch (this.value._tag) {
			case "Infinity": return "Infinity";
			case "NegativeInfinity": return "-Infinity";
			case "Nanos": return `${this.value.nanos} nanos`;
			case "Millis": return `${this.value.millis} millis`;
		}
	},
	toJSON() {
		switch (this.value._tag) {
			case "Millis": return {
				_id: "Duration",
				_tag: "Millis",
				millis: this.value.millis
			};
			case "Nanos": return {
				_id: "Duration",
				_tag: "Nanos",
				nanos: String(this.value.nanos)
			};
			case "Infinity": return {
				_id: "Duration",
				_tag: "Infinity"
			};
			case "NegativeInfinity": return {
				_id: "Duration",
				_tag: "NegativeInfinity"
			};
		}
	},
	[za]() {
		return this.toJSON();
	},
	pipe() {
		return xi(this, arguments);
	}
}, Pc = (e) => {
	let t = Object.create(Nc);
	return t.value = typeof e == "number" ? isNaN(e) || e === 0 || Object.is(e, -0) ? Ac : Number.isFinite(e) ? Number.isInteger(e) ? {
		_tag: "Millis",
		millis: e
	} : {
		_tag: "Nanos",
		nanos: Tc(e)
	} : e > 0 ? jc : Mc : e === yc ? Ac : {
		_tag: "Nanos",
		nanos: e
	}, t;
}, Fc = (e) => L(e, vc), Ic = /*#__PURE__*/ Pc(0), Lc = /*#__PURE__*/ Pc(Infinity), Rc = /*#__PURE__*/ Pc(-Infinity), zc = (e) => Pc(e), Bc = (e) => Pc(e), Vc = (e) => Pc(e * 1e3), Hc = (e) => Pc(e * 6e4), Uc = (e) => Pc(e * 36e5), Wc = (e) => Pc(e * 864e5), Gc = (e) => Pc(e * 6048e5), Kc = (e) => Jc(Oc(e), {
	onMillis: I,
	onNanos: (e) => Number(e) / 1e6,
	onInfinity: () => Infinity,
	onNegativeInfinity: () => -Infinity
}), qc = (e) => {
	let t = Oc(e);
	switch (t.value._tag) {
		case "Infinity":
		case "NegativeInfinity": throw Error("Cannot convert infinite duration to nanos");
		case "Nanos": return t.value.nanos;
		case "Millis": return Tc(t.value.millis);
	}
}, Jc = /*#__PURE__*/ F(2, (e, t) => {
	switch (e.value._tag) {
		case "Millis": return t.onMillis(e.value.millis);
		case "Nanos": return t.onNanos(e.value.nanos);
		case "Infinity": return t.onInfinity();
		case "NegativeInfinity": return (t.onNegativeInfinity ?? t.onInfinity)();
	}
}), Yc = /*#__PURE__*/ F(3, (e, t, n) => e.value._tag === "Infinity" || e.value._tag === "NegativeInfinity" || t.value._tag === "Infinity" || t.value._tag === "NegativeInfinity" ? n.onInfinity(e, t) : e.value._tag === "Millis" ? t.value._tag === "Millis" ? n.onMillis(e.value.millis, t.value.millis) : n.onNanos(qc(e), t.value.nanos) : n.onNanos(e.value.nanos, qc(t))), Xc = (e, t) => Yc(e, t, {
	onMillis: (e, t) => e === t,
	onNanos: (e, t) => e === t,
	onInfinity: (e, t) => e.value._tag === t.value._tag
}), Zc = /*#__PURE__*/ F(2, (e, t) => Xc(e, t)), Qc = /*#__PURE__*/ ec("effect/Scheduler", {
	fiberCached: !0,
	defaultValue: () => new rl()
}), $c = (e) => {
	let t = !1;
	return Promise.resolve().then(() => {
		t || e();
	}), () => {
		t = !0;
	};
}, el = "setImmediate" in globalThis ? (e) => {
	let t = globalThis.setImmediate(e);
	return () => globalThis.clearImmediate(t);
} : (e) => {
	let t = setTimeout(e, 0);
	return () => clearTimeout(t);
}, tl = (e) => {
	try {
		return el(e);
	} catch {
		return $c(e);
	}
}, nl = class {
	buckets = [];
	scheduleTask(e, t) {
		let n = this.buckets, r = n.length, i, a = 0;
		for (; a < r && !(n[a][0] > t); a++) i = n[a];
		i && i[0] === t ? i[1].push(e) : a === r ? n.push([t, [e]]) : n.splice(a, 0, [t, [e]]);
	}
	drain() {
		let e = this.buckets;
		return this.buckets = [], e;
	}
}, rl = class {
	executionMode;
	setImmediate;
	constructor(e = "async", t) {
		this.executionMode = e, this.setImmediate = t ?? (e === "sync" ? $c : tl);
	}
	shouldYield(e) {
		return e.currentOpCount >= e.cache.maxOpsBeforeYield;
	}
	makeDispatcher() {
		return new il(this.setImmediate);
	}
}, il = class {
	tasks = /*#__PURE__*/ new nl();
	running = void 0;
	setImmediate;
	constructor(e = tl) {
		this.setImmediate = e;
	}
	scheduleTask(e, t) {
		this.tasks.scheduleTask(e, t), this.running === void 0 && (this.running = this.setImmediate(this.afterScheduled));
	}
	afterScheduled = () => {
		this.running = void 0, this.runTasks();
	};
	runTasks() {
		let e = this.tasks.drain();
		for (let t = 0; t < e.length; t++) {
			let n = e[t][1];
			for (let e = 0; e < n.length; e++) n[e]();
		}
	}
	flush() {
		for (; this.tasks.buckets.length > 0;) this.running !== void 0 && (this.running(), this.running = void 0), this.runTasks();
	}
}, al = /*#__PURE__*/ ec("effect/Scheduler/MaxOpsBeforeYield", {
	fiberCached: !0,
	defaultValue: () => 2048
}), ol = /*#__PURE__*/ ec("effect/Scheduler/PreventSchedulerYield", {
	fiberCached: !0,
	defaultValue: () => !1
}), sl = Fo, cl = (e) => {
	switch (e) {
		case 16: return dl();
		case 32: return fl();
		default: {
			let t = "";
			for (let n = e >>> 3; n > 0; n--) t += ul();
			return t;
		}
	}
}, U = /*#__PURE__*/ Uint8Array.from("0123456789abcdef", (e) => e.charCodeAt(0)), ll = () => Math.random() * 4294967296 >>> 0, ul = () => {
	let e = ll();
	return String.fromCharCode(U[e >>> 28], U[e >>> 24 & 15], U[e >>> 20 & 15], U[e >>> 16 & 15], U[e >>> 12 & 15], U[e >>> 8 & 15], U[e >>> 4 & 15], U[e & 15]);
}, dl = () => {
	let e = ll(), t = ll();
	return String.fromCharCode(U[e >>> 28], U[e >>> 24 & 15], U[e >>> 20 & 15], U[e >>> 16 & 15], U[e >>> 12 & 15], U[e >>> 8 & 15], U[e >>> 4 & 15], U[e & 15], U[t >>> 28], U[t >>> 24 & 15], U[t >>> 20 & 15], U[t >>> 16 & 15], U[t >>> 12 & 15], U[t >>> 8 & 15], U[t >>> 4 & 15], U[t & 15]);
}, fl = () => {
	let e = ll(), t = ll(), n = ll(), r = ll();
	return String.fromCharCode(U[e >>> 28], U[e >>> 24 & 15], U[e >>> 20 & 15], U[e >>> 16 & 15], U[e >>> 12 & 15], U[e >>> 8 & 15], U[e >>> 4 & 15], U[e & 15], U[t >>> 28], U[t >>> 24 & 15], U[t >>> 20 & 15], U[t >>> 16 & 15], U[t >>> 12 & 15], U[t >>> 8 & 15], U[t >>> 4 & 15], U[t & 15], U[n >>> 28], U[n >>> 24 & 15], U[n >>> 20 & 15], U[n >>> 16 & 15], U[n >>> 12 & 15], U[n >>> 8 & 15], U[n >>> 4 & 15], U[n & 15], U[r >>> 28], U[r >>> 24 & 15], U[r >>> 20 & 15], U[r >>> 16 & 15], U[r >>> 12 & 15], U[r >>> 8 & 15], U[r >>> 4 & 15], U[r & 15]);
}, pl = "effect/Tracer/ParentSpan", ml = class extends (/*#__PURE__*/ Ss()(pl, { fiberCached: !0 })) {}, hl = (e) => e, gl = /*#__PURE__*/ ec("effect/Tracer/DisablePropagation", { defaultValue: Ei }), _l = /*#__PURE__*/ ec("effect/Tracer/CurrentTraceLevel", { defaultValue: () => "Info" }), vl = /*#__PURE__*/ ec("effect/Tracer/MinimumTraceLevel", { defaultValue: () => "All" }), yl = "effect/Tracer", bl = /*#__PURE__*/ hl({ span: (e) => new xl(e) }), xl = class {
	_tag = "Span";
	sampled;
	name;
	parent;
	annotations;
	links;
	startTime;
	kind;
	status;
	_traceId = void 0;
	_spanId = void 0;
	_attributes = void 0;
	_events = void 0;
	constructor(e) {
		this.name = e.name, this.parent = e.parent, this.annotations = e.annotations, this.links = e.links, this.startTime = e.startTime, this.kind = e.kind, this.sampled = e.sampled, this.status = {
			_tag: "Started",
			startTime: e.startTime
		};
	}
	get traceId() {
		return this._traceId ??= bs(this.parent)?.traceId ?? cl(32);
	}
	get spanId() {
		return this._spanId ??= cl(16);
	}
	get attributes() {
		return this._attributes ??= /* @__PURE__ */ new Map();
	}
	get events() {
		return this._events ??= [];
	}
	end(e, t) {
		this.status = {
			_tag: "Ended",
			endTime: e,
			exit: t,
			startTime: this.status.startTime
		};
	}
	attribute(e, t) {
		this.attributes.set(e, t);
	}
	event(e, t, n) {
		this.events.push([
			e,
			t,
			n ?? {}
		]);
	}
	addLinks(e) {
		this.links.push(...e);
	}
}, Sl = "effect/Metric/FiberRuntimeMetrics", Cl = /*#__PURE__*/ ec("effect/References/CurrentStackFrame", {
	fiberCached: !0,
	defaultValue: Di
}), wl = /*#__PURE__*/ ec("effect/References/TracerEnabled", {
	fiberCached: !0,
	defaultValue: Ti
}), Tl = /*#__PURE__*/ ec("effect/References/TracerTimingEnabled", { defaultValue: Ti }), El = /*#__PURE__*/ ec("effect/References/TracerSpanAnnotations", { defaultValue: () => ({}) }), Dl = /*#__PURE__*/ ec("effect/References/TracerSpanLinks", { defaultValue: () => [] }), Ol = /*#__PURE__*/ ec("effect/References/CurrentLogLevel", {
	fiberCached: !0,
	defaultValue: () => "Info"
}), kl = /*#__PURE__*/ ec("effect/References/MinimumLogLevel", {
	fiberCached: !0,
	defaultValue: () => "Info"
}), Al = (e) => (t) => {
	let n;
	return () => {
		if (n !== void 0) return n;
		let r = t();
		if (!r) return;
		let i = r.split("\n");
		if (i[e] !== void 0) return n = i[e].trim(), n;
	};
}, jl = class extends po {
	constructor(e, t = mo) {
		super("Interrupt", t, "Interrupted"), this.fiberId = e;
	}
	toString() {
		return `Interrupt(${this.fiberId})`;
	}
	toJSON() {
		return {
			_tag: "Interrupt",
			fiberId: this.fiberId
		};
	}
	[la](e) {
		return Co(e) && this.fiberId === e.fiberId && this.annotations === e.annotations;
	}
	[Gi]() {
		return Ji(Qi(`${this._tag}:${this.fiberId}`))(Ki(this.annotations));
	}
}, Ml = (e) => new uo([new jl(e)]), Nl = (e) => {
	for (let t = 0; t < e.reasons.length; t++) {
		let n = e.reasons[t];
		if (n._tag === "Fail") return rc(n.error);
	}
	return ic(e);
}, Pl = (e) => e.reasons.some(Co), Fl = (e) => {
	let t;
	for (let n = 0; n < e.reasons.length; n++) {
		let r = e.reasons[n];
		r._tag === "Interrupt" && (t ??= /* @__PURE__ */ new Set(), r.fiberId !== void 0 && t.add(r.fiberId));
	}
	return t ? rc(t) : ic(e);
}, Il = (e, t) => {
	let n = /* @__PURE__ */ new Map(), r = [];
	for (let i of e.concat(t)) {
		let e = R(i), t = n.get(e);
		if (t === void 0) n.set(e, [i]);
		else if (t.some((e) => ua(e, i))) continue;
		else t.push(i);
		r.push(i);
	}
	return r;
}, Ll = /*#__PURE__*/ F(2, (e, t) => {
	if (e.reasons.length === 0) return t;
	if (t.reasons.length === 0) return e;
	let n = new uo(Il(e.reasons, t.reasons));
	return ua(e, n) ? e : n;
}), Rl = /*#__PURE__*/ F(2, (e, t) => {
	let n = !1, r = e.reasons.map((e) => xo(e) ? (n = !0, new ho(t(e.error), e.annotations)) : e);
	return n ? go(r) : e;
}), zl = (e) => {
	let t;
	for (let n of e.reasons) {
		if (n._tag === "Fail") return n.error;
		n._tag === "Die" && (t ??= n);
	}
	return t === void 0 ? e.reasons.length > 0 ? new globalThis.Error("All fibers interrupted without error") : new globalThis.Error("Empty cause") : t.defect;
}, Bl = "~effect/Fiber", Vl = {
	_A: I,
	_E: I
}, Hl = { id: 0 }, Ul = () => globalThis[ka], Wl = class {
	constructor(e, t = !0) {
		this.setContext(e), this.id = ++Hl.id, this.currentOpCount = 0, this.interruptible = t, this._stack = [], this._observers = void 0, this._exit = void 0, this._children = void 0, this._interruptedCause = void 0, this._yielded = void 0, this._running = !1, this._deferredInterrupt = !1, this._parent = void 0, this.cache.runtimeMetrics?.recordFiberStart(this.context);
	}
	get [Bl]() {
		return Vl;
	}
	get currentDispatcher() {
		return this._dispatcher ??= this.cache.scheduler.makeDispatcher();
	}
	getRef(e) {
		return Js(this.context, e);
	}
	addObserver(e) {
		return this._exit ? (e(this._exit), Oi) : (this._observers === void 0 ? this._observers = [e] : this._observers.push(e), () => this.removeObserver(e));
	}
	removeObserver(e) {
		if (this._exit || this._observers === void 0) return;
		let t = this._observers.indexOf(e);
		t >= 0 && this._observers.splice(t, 1);
	}
	interruptUnsafe(e, t) {
		if (this._exit) return;
		let n = Ml(e);
		this.cache.stackFrame && (n = bo(n, Hs(Oo, this.cache.stackFrame))), t && (n = bo(n, t)), this._interruptedCause = this._interruptedCause ? Ll(this._interruptedCause, n) : n, this.interruptible && (this._running ? this._deferredInterrupt = !0 : this.evaluate(nu(this._interruptedCause)));
	}
	pollUnsafe() {
		return this._exit;
	}
	evaluate(e) {
		if (this._exit) return;
		if (this._yielded !== void 0) {
			let e = this._yielded;
			this._yielded = void 0, e();
		}
		let t = this.runLoop(e);
		if (t === no) return;
		let n = Jl.interruptChildren && Jl.interruptChildren(this);
		if (n !== void 0) return this.evaluate(Bu(n, () => t));
		if (this._exit = t, this.cache.runtimeMetrics?.recordFiberEnd(this.context, this._exit), this._parent &&= (this._parent._children?.delete(this), void 0), this._observers !== void 0) {
			let e = this._observers;
			this._observers = void 0;
			for (let n = 0; n < e.length; n++) e[n](t);
		}
		this._stack.length = 0, this._children = void 0, this.context = Bs();
	}
	runLoop(e) {
		let t = globalThis[ka];
		globalThis[ka] = this;
		let n = this._running;
		this._running = !0;
		let r = !1, i = e;
		this.currentOpCount = 0;
		try {
			for (;;) {
				this._deferredInterrupt && (this._deferredInterrupt = !1, i = nu(this._interruptedCause)), this.currentOpCount++;
				let e = this.cache;
				if (!r && !e.preventYield && e.scheduler.shouldYield(this)) {
					r = !0;
					let e = i;
					i = Bu(iu, () => e);
				}
				if (i = e.tracerContext ? e.tracerContext(i, this) : i[B](this), i === no) {
					let e = this._yielded;
					if (Xa in e) return this._deferredInterrupt = !1, this._yielded = void 0, e;
					if (this._deferredInterrupt) {
						this._yielded = void 0, e();
						continue;
					}
					return no;
				}
			}
		} catch (e) {
			return L(i, B) ? this.runLoop(Mo(e)) : Mo(`Fiber.runLoop: Not a valid effect: ${String(i)}`);
		} finally {
			this._running = n, globalThis[ka] = t;
		}
	}
	getCont(e) {
		if (this._deferredInterrupt) return this._deferredInterrupt = !1, Kl;
		for (;;) {
			let t = this._stack.pop();
			if (!t) return;
			let n = t[to];
			if (n !== void 0) {
				let r = n.call(t, this);
				if (r) return r[e] = r, r;
			}
			if (t[e]) return t;
		}
	}
	succeedWith(e) {
		if (!(++this.currentOpCount & ql - 1)) return V(e);
		let t = this.getCont($a);
		return t ? t[$a](e, this) : this.yieldWith(V(e));
	}
	yieldWith(e) {
		return this._yielded = e, no;
	}
	children() {
		return this._children ??= /* @__PURE__ */ new Set();
	}
	pipe() {
		return xi(this, arguments);
	}
	setContext(e) {
		let t = this.context;
		if (this.context = e, t !== void 0 && Ls(t, e)) return;
		let n = e.cacheRoot, r = n._fiberCache ??= Gl(e);
		this.cache?.scheduler !== r.scheduler && (this._dispatcher = void 0), this.cache = r;
	}
	get currentSpanLocal() {
		let e = this.cache.span;
		return e?._tag === "Span" ? e : void 0;
	}
}, Gl = (e) => {
	let t = Ks(e, yl);
	return {
		scheduler: Js(e, Qc),
		tracer: t,
		tracerContext: t ? t.context : void 0,
		tracerEnabled: Js(e, wl),
		span: Ks(e, pl),
		logLevel: Js(e, Ol),
		minimumLogLevel: Js(e, kl),
		stackFrame: Js(e, Cl),
		runtimeMetrics: Ks(e, Sl),
		maxOpsBeforeYield: Js(e, al),
		preventYield: Js(e, ol)
	};
}, Kl = {
	[$a](e, t) {
		return nu(t._interruptedCause);
	},
	[eo](e, t) {
		return nu(t._interruptedCause);
	}
}, ql = 32, Jl = { interruptChildren: void 0 }, Yl = (e) => {
	if (!e.cache.stackFrame) return;
	let t = /* @__PURE__ */ new Map();
	return t.set(ko.key, e.cache.stackFrame), Fs(t);
}, Xl = (e) => {
	let t = e;
	return t._exit ? W(t._exit) : fu((n) => t._exit ? n(W(t._exit)) : G(e.addObserver((e) => n(W(e)))));
}, Zl = (e) => fu((t) => {
	let n = e[Symbol.iterator](), r = [], i;
	function a() {
		let e = n.next();
		for (; !e.done;) {
			if (e.value._exit) {
				r.push(e.value._exit), e = n.next();
				continue;
			}
			i = e.value.addObserver((e) => {
				r.push(e), a();
			});
			return;
		}
		t(W(r));
	}
	return a(), G(() => i?.());
}), Ql = (e) => {
	let t = e;
	return t._exit ? t._exit : fu((n) => t._exit ? n(t._exit) : G(e.addObserver(n)));
}, $l = (e) => H((t) => eu(e, t.id)), eu = /*#__PURE__*/ F((e) => L(e[0], Bl), (e, t, n) => H((r) => {
	let i = Yl(r);
	return i = i && n ? Qs(i, n) : i ?? n, e.interruptUnsafe(t, i), Lu(Xl(e));
})), tu = (e) => H((t) => {
	let n = Yl(t), r = hc();
	for (let i of e) i.interruptUnsafe(t.id, n), r.push(i);
	return Lu(Zl(r));
}), W = V, nu = Ao, ru = jo, G = /*#__PURE__*/ Eo({
	op: "Sync",
	[B](e) {
		let t = this[z](), n = e.getCont($a);
		return n ? n[$a](t, e) : e.yieldWith(V(t));
	}
}), K = /*#__PURE__*/ Eo({
	op: "Suspend",
	[B](e) {
		return this[z]();
	}
}), iu = /*#__PURE__*/ (/* @__PURE__ */ Eo({
	op: "Yield",
	[B](e) {
		let t = !1;
		return e.currentDispatcher.scheduleTask(() => {
			t || e.evaluate(Ju);
		}, this[z] ?? 0), e.yieldWith(() => {
			t = !0;
		});
	}
}))(0), au = /*#__PURE__*/ W(/*#__PURE__*/ gs()), ou = (e) => K(() => nu(e())), su = (e) => Mo(e), cu = (e) => K(() => ru(e())), q = /*#__PURE__*/ W(void 0), lu = (e) => H((t) => e(t.id)), uu = /*#__PURE__*/ function() {
	let e = /*#__PURE__*/ To({
		op: "Async",
		[B](e) {
			let t = !1, n = !1, r = this.withSignal ? new AbortController() : void 0, i = this.register.call(e.cache.scheduler, (r) => {
				t || (t = !0, n ? e.evaluate(r) : n = r);
			}, r?.signal);
			return n === !1 ? (n = !0, e._yielded = () => {
				t = !0;
			}, r === void 0 && i === void 0 || e._stack.push(du(() => (t = !0, r?.abort(), i ?? Ju))), no) : n;
		}
	}), t = function(e, t) {
		this.register = e, this.withSignal = t;
	};
	return t.prototype = e, function(e, n) {
		return new t(e, n);
	};
}(), du = /*#__PURE__*/ Eo({
	op: "AsyncFinalizer",
	[to](e) {
		e.interruptible && (e.interruptible = !1, e._stack.push(Xd));
	},
	[eo](e, t) {
		return Pl(e) ? Bu(Dd(Ao(e), this[z]()), () => nu(e)) : nu(e);
	}
}), fu = (e) => uu(e, e.length >= 2), pu = /*#__PURE__*/ fu(Oi), mu = (...e) => {
	if (e.length === 1) {
		let t = e[0];
		return K(() => Su(t()));
	}
	let [t, n] = e;
	return K(() => Su(n.call(t.self)));
}, hu = (e, ...t) => {
	let n = t.length === 0 ? function() {
		return K(() => Su(e.apply(this, arguments)));
	} : function() {
		let n = K(() => Su(e.apply(this, arguments)));
		for (let e = 0; e < t.length; e++) n = t[e](n, ...arguments);
		return n;
	};
	return gu(e.length, n);
}, gu = (e, t) => Object.defineProperty(t, "length", {
	value: e,
	configurable: !0
}), _u = /*#__PURE__*/ Al(2), vu = function() {
	let e = typeof arguments[0] == "string", t = e ? arguments[0] : "Effect.fn", n = e ? arguments[1] : void 0, r = Ua(), i;
	return r !== 0 && (Wa(2), i = new globalThis.Error(), Wa(r)), e ? (r, ...a) => yu(t, r, i, a, e, n) : yu(t, arguments[0], i, Array.prototype.slice.call(arguments, 1), e, n);
}, yu = (e, t, n, r, i, a) => {
	let o = typeof t == "function" ? t : r.shift().bind(t.self), s = `${e} (definition)`, c = n ? _u(() => n.stack) : Di;
	return gu(o.length, function(...t) {
		let n = K(() => {
			let e = o.apply(this, arguments);
			return ao(e) ? e : Su(e);
		});
		for (let e = 0; e < r.length; e++) n = r[e](n, ...t);
		if (!ao(n)) return n;
		let l = Ua(), u;
		return l !== 0 && (Wa(2), u = new globalThis.Error(), Wa(l)), $u(i ? Af(e, a, (e) => jf(n, e)) : n, Cl, (t) => ({
			name: e,
			stack: u ? _u(() => u.stack) : Di,
			parent: {
				name: s,
				stack: c,
				parent: t
			}
		}));
	});
}, bu = (e, ...t) => gu(e.length, t.length === 0 ? function() {
	return xu(() => e.apply(this, arguments));
} : function() {
	let n = xu(() => e.apply(this, arguments));
	for (let e of t) n = e(n, ...arguments);
	return n;
}), xu = (e) => {
	try {
		let t = e(), n;
		for (;;) {
			let r = t.next(n);
			if (r.done) return W(r.value);
			let i = r.value;
			if (i && i._tag === "Success") {
				n = i.value;
				continue;
			}
			if (i && i._tag === "Failure") return r.value;
			{
				let n = !0;
				return K(() => n ? (n = !1, Bu(r.value, (e) => Su(t, e))) : K(() => Su(e())));
			}
		}
	} catch (e) {
		return su(e);
	}
}, Su = /*#__PURE__*/ function() {
	let e = /*#__PURE__*/ To({
		op: "Iterator",
		[$a](e, t) {
			let n = this.iterator;
			for (;;) {
				let r = n.next(e);
				if (r.done) return W(r.value);
				if (!J(r.value)) return t._stack.push(this), r.value;
				if (r.value._tag === "Failure") return r.value;
				e = r.value.value;
			}
		},
		[B](e) {
			return this[$a](this.initial, e);
		}
	}), t = function(e, t) {
		this.iterator = e, this.initial = t;
	};
	return t.prototype = e, function(e, n) {
		return new t(e, n);
	};
}(), Cu = /*#__PURE__*/ F(2, (e, t) => new Eu(e, Du, W(t))), wu = function(e) {
	return e._stack.push(this), this[z];
}, Tu = /*#__PURE__*/ To({
	op: "OnSuccess",
	[B]: wu
}), Eu = function(e, t, n) {
	this[z] = e, this[$a] = t, this.payload = n;
};
Eu.prototype = Tu;
var Du = function() {
	return this.payload;
}, Ou = function(e, t) {
	return t.succeedWith(this.payload);
}, ku = /*#__PURE__*/ (() => {
	let e = "~effect/Effect/stackProbe";
	return { [e]: function() {
		return (/* @__PURE__ */ Error()).stack;
	} }[e]()?.includes("[as " + e + "]") === !0;
})(), Au = function(e, t) {
	let n = this.payload;
	return t.succeedWith(ku ? n(e) : Ka(() => n(e)));
}, ju = function(e) {
	let t = this.payload;
	return t(e);
}, Mu = function(e) {
	let t = this.payload;
	return new Eu(t(e), Ou, e);
}, Nu = function(e) {
	return new Eu(this.payload, Ou, e);
}, Pu = (e) => Uu(e, _s), Fu = /*#__PURE__*/ F(2, (e, t) => new Eu(e, ao(t) ? Du : ju, t)), Iu = /*#__PURE__*/ F(2, (e, t) => new Eu(e, ao(t) ? Nu : Mu, t)), Lu = (e) => new Eu(e, Du, Ju), Ru = (e, t) => H((n) => {
	let r = /* @__PURE__ */ new Set();
	return Vd(n, () => r.size === 0 ? void 0 : tu(r)), fu((i) => {
		let a = !1, o = 0;
		for (let s of e) {
			if (a) break;
			let e = o++, c = df(n, s, !0, !0, !1);
			r.add(c), c.addObserver((o) => {
				r.delete(c);
				let s = !a;
				a = !0, i(o), s && t?.onWinner && t.onWinner({
					fiber: c,
					index: e,
					parentFiber: n
				});
			});
		}
	});
}), zu = /*#__PURE__*/ F((e) => ao(e[1]), (e, t, n) => Ru([e, t], n)), Bu = /*#__PURE__*/ F(2, (e, t) => new Eu(e, ju, t)), J = (e) => e[Xa] !== void 0, Vu = /*#__PURE__*/ F(2, (e, t) => J(e) ? e._tag === "Success" ? t(e.value) : e : Bu(e, t)), Hu = (e) => Bu(e, I), Uu = /*#__PURE__*/ F(2, (e, t) => new Eu(e, Au, t)), Wu = /*#__PURE__*/ F(2, (e, t) => J(e) ? Yu(e, t) : Uu(e, t)), Gu = (e) => Ao(Ml(e)), Ku = (e) => e._tag === "Success", qu = (e) => e._tag === "Failure" ? rc(e.cause) : ic(e), Ju = /*#__PURE__*/ V(void 0), Yu = /*#__PURE__*/ F(2, (e, t) => e._tag === "Success" ? V(t(e.value)) : e), Xu = /*#__PURE__*/ F(2, (e, t) => Ku(e) ? t : e), Zu = (e) => {
	let t = [];
	for (let n of e) n._tag === "Failure" && t.push(...n.cause.reasons);
	return t.length === 0 ? Ju : Ao(go(t));
}, Qu = /*#__PURE__*/ F(2, (e, t) => H((n) => {
	let r = n.context, i = t(r);
	return r === i ? e : (n.setContext(i), Vd(n, () => {
		n.setContext(r);
	}), e);
})), $u = /*#__PURE__*/ F(3, (e, t, n) => Qu(e, (e) => {
	let r = qs(e, t), i = n(r);
	return r === i ? e : Us(e, t, i);
})), ed = () => td, td = /*#__PURE__*/ H((e) => W(e.context)), nd = (e) => H((t) => e(t.context)), rd = /*#__PURE__*/ F(2, (e, t) => J(e) ? e : Qu(e, Qs(t))), id = function() {
	return arguments.length === 1 ? F(2, (e, t) => ad(e, arguments[0], t)) : F(3, (e, t, n) => ad(e, t, n)).apply(this, arguments);
}, ad = (e, t, n) => Qu(e, Us(t, n)), od = /*#__PURE__*/ F(2, (e, t) => Bu(t, (t) => t ? Pu(e) : au)), sd = /*#__PURE__*/ F((e) => ao(e[0]), (e, t) => nf({
	while: Ti,
	body: wi(t?.disableYield ? e : Bu(e, (e) => iu)),
	step: Oi
})), cd = /*#__PURE__*/ F(2, (e, t) => new ud(e, t.length === 1 ? t : (e) => t(e))), ld = /*#__PURE__*/ To({
	op: "OnFailure",
	[B]: wu
}), ud = function(e, t) {
	this[z] = e, this[eo] = t;
};
ud.prototype = ld;
var dd = /*#__PURE__*/ F(3, (e, t, n) => cd(e, (e) => {
	let r = t(e);
	return oc(r) ? nu(r.failure) : n(r.success, e);
})), fd = /*#__PURE__*/ F(2, (e, t) => dd(e, Nl, (e) => t(e))), pd = /*#__PURE__*/ F((e) => ao(e[0]), (e, t, n, r) => cd(e, (e) => {
	let i = Nl(e);
	return oc(i) ? nu(i.failure) : t(i.success) ? n(i.success) : r ? r(i.success) : nu(e);
})), md = /*#__PURE__*/ F((e) => ao(e[0]), (e, t, n, r) => pd(e, Array.isArray(t) ? (e) => L(e, "_tag") && t.includes(e._tag) : Wi(t), n, r)), hd = /*#__PURE__*/ F(2, (e, t) => fd(e, (e) => cu(() => t(e)))), gd = /*#__PURE__*/ F(2, (e, t) => new vd(e, t.onSuccess.length === 1 ? t.onSuccess : (e) => t.onSuccess(e), t.onFailure.length === 1 ? t.onFailure : (e) => t.onFailure(e))), _d = /*#__PURE__*/ To({
	op: "OnSuccessAndFailure",
	[B]: wu
}), vd = function(e, t, n) {
	this[z] = e, this[$a] = t, this[eo] = n;
};
vd.prototype = _d;
var yd = (e) => J(e) ? V(e) : bd(e), bd = /*#__PURE__*/ Eo({
	op: "Exit",
	[B](e) {
		return e._stack.push(this), this[z];
	},
	[$a](e, t, n) {
		return t.succeedWith(n ?? V(e));
	},
	[eo](e, t, n) {
		return t.succeedWith(n ?? Ao(e));
	}
}), xd = "~effect/Scope", Sd = "~effect/Scope/Closeable", Cd = /*#__PURE__*/ Ss("effect/Scope"), wd = (e, t) => H((n) => {
	let r = Td(e, t);
	return r === void 0 ? q : ($d(n), r);
}), Td = (e, t) => {
	let n = e.state;
	if (n._tag === "Closed" || (e.state = {
		_tag: "Closed",
		exit: t
	}, e.parent !== void 0 && Nd(e.parent, e), n._tag === "Empty")) return;
	if (n.finalizer !== void 0) return Ed(n.finalizer, t);
	let r = n.finalizers;
	return r.size === 1 ? Ed(r.values().next().value, t) : Od(e, r, t);
}, Ed = (e, t) => {
	try {
		return e(t);
	} catch (e) {
		return Mo(e);
	}
}, Dd = (e, t) => Ku(e) ? t : cd(t, (t) => nu(Ll(e.cause, t))), Od = /*#__PURE__*/ hu(function* (e, t, n) {
	let r = [], i = [], a = Array.from(t.values()), o = Ul();
	for (let t = a.length - 1; t >= 0; t--) {
		let s = a[t];
		e.strategy === "sequential" ? r.push(yield* yd(Ed(s, n))) : i.push(df(o, Ed(s, n), !0, !0, "inherit"));
	}
	return i.length > 0 && (r = yield* Zl(i)), yield* Zu(r);
}), kd = (e, t) => {
	let n = Fd(t, e);
	return e.state._tag === "Closed" ? (n.state = e.state, n) : (Md(e, n, (e) => wd(n, e)), n);
}, Ad = (e, t) => K(() => e.state._tag === "Closed" ? t(e.state.exit) : (Md(e, {}, t), q)), jd = (e, t) => Ad(e, wi(t)), Md = (e, t, n) => {
	if (e.state._tag === "Empty") e.state = {
		_tag: "Open",
		finalizerKey: t,
		finalizer: n,
		finalizers: void 0
	};
	else if (e.state._tag === "Open") {
		let r = e.state;
		r.finalizer === void 0 ? r.finalizers.set(t, n) : (r.finalizers = /* @__PURE__ */ new Map([[r.finalizerKey, r.finalizer]]), r.finalizerKey = void 0, r.finalizer = void 0, r.finalizers.set(t, n));
	}
}, Nd = (e, t) => {
	if (e.state._tag !== "Open") return;
	let n = e.state;
	n.finalizerKey === t ? e.state = Id : n.finalizers !== void 0 && (n.finalizers.delete(t), n.finalizers.size === 0 && (e.state = Id));
}, Pd = (e) => Fd(e, void 0), Fd = (e = "sequential", t) => ({
	[Sd]: Sd,
	[xd]: xd,
	strategy: e,
	parent: t,
	state: Id
}), Id = { _tag: "Empty" }, Ld = /*#__PURE__*/ id(Cd), Rd = (e) => K(() => {
	let t = Pd();
	return Hd(e(t), (e) => K(() => Td(t, e) ?? q));
}), zd = /*#__PURE__*/ function() {
	let e = /*#__PURE__*/ To({
		op: "OnExit",
		[B](e) {
			return e._stack.push(this), this.effect;
		},
		[to](e) {
			e.interruptible && this.interruptible !== !0 && (e._stack.push(Xd), e.interruptible = !1);
		},
		[$a](e, t, n) {
			n ??= V(e);
			let r;
			try {
				r = this.onExit(n);
			} catch (e) {
				r = Mo(e);
			}
			return r ? Bu(r, (e) => n) : n;
		},
		[eo](e, t, n) {
			n ??= Ao(e);
			let r;
			try {
				r = this.onExit(n);
			} catch (e) {
				r = Mo(e);
			}
			return r ? Bu(Dd(n, r), (e) => n) : n;
		}
	}), t = function(e, t, n) {
		this.effect = e, this.onExit = t, this.interruptible = n;
	};
	return t.prototype = e, t;
}(), Bd = (e, t, n) => new zd(e, t, n), Vd = (e, t) => {
	e._stack.push(new zd(void 0, t, void 0));
}, Hd = /*#__PURE__*/ F(2, Bd), Ud = /*#__PURE__*/ F(3, (e, t, n) => Hd(e, (e) => {
	let r = t(e);
	return oc(r) ? q : n(r.success, e);
})), Wd = /*#__PURE__*/ F(2, (e, t) => Ud(e, qu, t)), Gd = /*#__PURE__*/ F(3, (e, t, n) => Hd(e, (e) => {
	if (e._tag !== "Failure") return q;
	let r = t(e.cause);
	return oc(r) ? q : n(r.success, e.cause);
})), Kd = /*#__PURE__*/ F(2, (e, t) => Gd(Fl, t)(e)), qd = /*#__PURE__*/ H((e) => nu(Ml(e.id))), Jd = (e) => H((t) => t.interruptible ? (t.interruptible = !1, t._stack.push(Xd), e) : e), Yd = /*#__PURE__*/ Eo({
	op: "SetInterruptible",
	[to](e) {
		if (e.interruptible = this[z], e._interruptedCause && e.interruptible) return () => nu(e._interruptedCause);
	}
}), Xd = /*#__PURE__*/ Yd(!0), Zd = /*#__PURE__*/ Yd(!1), Qd = (e) => {
	if (e.interruptible = !0, e._stack.push(Zd), e._interruptedCause) return nu(e._interruptedCause);
}, $d = (e) => {
	let t = e;
	t.interruptible && (t.interruptible = !1, t._stack.push(Xd));
}, ef = (e) => H((t) => t.interruptible ? e : Qd(t) ?? e), tf = (e) => H((t) => t.interruptible ? (t.interruptible = !1, t._stack.push(Xd), e(ef)) : e(I)), nf = /*#__PURE__*/ Eo({
	op: "While",
	[$a](e, t) {
		return this[z].step(e), this[z].while() ? (t._stack.push(this), this[z].body()) : Ju;
	},
	[B](e) {
		return this[z].while() ? (e._stack.push(this), this[z].body()) : Ju;
	}
}), rf = /*#__PURE__*/ F((e) => typeof e[1] == "function", (e, t, n) => K(() => {
	let r = of(n?.concurrency);
	if (r === 1) return af(e, t, n);
	let i = uc(e), a = i.length;
	if (a === 0) return n?.discard ? q : W([]);
	let o = n?.discard ? void 0 : Array(a), s = uf({
		f: t,
		out: o
	}, i, { concurrency: r });
	return s ? Cu(s, o) : W(o);
})), af = (e, t, n) => K(() => {
	let r = n?.discard ? void 0 : [], i = e[Symbol.iterator](), a = i.next(), o = 0;
	return Cu(nf({
		while: () => !a.done,
		body: () => t(a.value, o++),
		step: (e) => {
			r && r.push(e), a = i.next();
		}
	}), r);
}), of = (e) => e === "unbounded" ? Infinity : Math.max(1, e ?? 1), sf = () => (e) => {
	let t = e.onItem, n = e.step, r = (e, t, r, a, o) => Bu(yd(o), (o) => n(e, t[r], o, r) ?? i(e, t, r + 1, a) ?? q), i = (e, i, a = 0, o = i.length) => {
		for (; a < o; a++) {
			let s = i[a], c = t(e, s, a);
			if (!J(c)) return r(e, i, a, o, c);
			let l = n(e, s, c, a);
			if (l) return l._tag === "Failure" ? l : void 0;
		}
	};
	return i;
}, cf = (e) => {
	let t = e.onItem, n = e.step;
	return (e, r, i) => {
		let a = 0, o = i.end ?? r.length, s = i.concurrency, c = !1, l, u, d, f, p, m = (e) => {
			let t = Mo(e);
			return f = t, c = !0, u && u.size > 0 ? Bu(Jd(tu(Array.from(u))), () => f ?? t) : t;
		}, h = () => {
			let i = !1;
			for (; !f && a < o; a++) {
				let o = r[a], g = p ?? t(e, o, a);
				if (J(g)) {
					if (f = n(e, o, g, a), f) break;
				} else if (l) {
					p = void 0;
					let t = df(l, g, !0, !0, "inherit");
					if (t._exit) {
						if (f = n(e, o, t._exit, a), f) break;
						continue;
					}
					u.add(t);
					let r = a;
					if (t.addObserver((a) => {
						u.delete(t);
						try {
							if (f) {
								if (a._tag === "Failure") {
									let e = a.cause.reasons.filter((e) => e._tag !== "Interrupt");
									if (e.length > 0) {
										let t = go(e);
										f = Ao(f._tag === "Failure" ? Ll(f.cause, t) : t);
									}
								}
							} else {
								let t = n(e, o, a, r);
								t && (f = t, h());
							}
							if (i) {
								let e = h();
								e && d(e);
							} else c && u.size === 0 && d(f ?? q);
						} catch (e) {
							d(m(e));
						}
					}), u.size < s) continue;
					i = !0, a++;
					return;
				} else return fu((e) => {
					l = Ul(), u = /* @__PURE__ */ new Set(), p = g, d = e;
					let t;
					try {
						t = h();
					} catch (t) {
						return e(m(t));
					}
					return t ? e(t) : K(() => (f ??= Ju, Bu(u ? tu(u) : q, () => f?._tag === "Failure" ? f : q)));
				});
			}
			if (c = !0, f) {
				if (u && u.size > 0) {
					let e = Yl(l);
					u.forEach((t) => t.interruptUnsafe(l.id, e));
					return;
				}
				if (d || f._tag === "Failure") return f;
			} else if (d) {
				if (u) u.size === 0 && d(q);
				else return Ju;
			}
		};
		return h();
	};
}, lf = () => (e) => cf(e), uf = /*#__PURE__*/ cf({
	onItem(e, t, n) {
		return e.f(t, n);
	},
	step(e, t, n, r) {
		if (n._tag === "Failure") return n;
		e.out && (e.out[r] = n.value);
	}
}), df = (e, t, n = !1, r = !1, i = !1) => {
	let a = e, o = i === "inherit" ? a.interruptible : !i, s = new Wl(a.context, o);
	return n ? s.evaluate(t) : a.currentDispatcher.scheduleTask(() => s.evaluate(t), 0), !r && !s._exit && (a.children().add(s), s._parent = a), s;
}, ff = /*#__PURE__*/ F((e) => ao(e[0]), (e, t) => H((n) => W(df(n, e, t?.startImmediately, !0, t?.uninterruptible)))), pf = /*#__PURE__*/ F((e) => ao(e[0]), (e, t, n) => H((r) => {
	let i = df(r, e, n?.startImmediately, !0, n?.uninterruptible);
	if (!i._exit) {
		if (t.state._tag !== "Closed") {
			let e = {};
			Md(t, e, () => lu((e) => e === i.id ? q : $l(i))), i.addObserver(() => Nd(t, e));
		} else i.interruptUnsafe(r.id, Yl(r));
	}
	return W(i);
})), mf = (e) => (t, n) => {
	let r = new Wl(n?.scheduler ? Us(e, Qc, n.scheduler) : e, n?.uninterruptible !== !0);
	if (r.evaluate(t), r._exit) return r;
	if (n?.signal) {
		if (n.signal.aborted) r.interruptUnsafe();
		else {
			let e = () => r.interruptUnsafe();
			n.signal.addEventListener("abort", e, { once: !0 }), r.addObserver(() => n.signal.removeEventListener("abort", e));
		}
	}
	return n?.onFiberStart && n.onFiberStart(r), r;
}, hf = /*#__PURE__*/ F(2, (e, t) => {
	if (e._exit) return e;
	if (t.state._tag === "Closed") return e.interruptUnsafe(e.id), e;
	let n = {};
	return Md(t, n, () => $l(e)), e.addObserver(() => Nd(t, n)), e;
}), gf = /*#__PURE__*/ mf(/*#__PURE__*/ Bs()), _f = (e) => {
	let t = mf(e);
	return (e) => {
		if (J(e)) return e;
		let n = new rl("sync"), r = t(e, { scheduler: n });
		return r._dispatcher?.flush(), r._exit ?? Mo(new Vf(r));
	};
}, vf = /*#__PURE__*/ _f(/*#__PURE__*/ Bs()), yf = /*#__PURE__*/ ((e) => {
	let t = _f(e);
	return (e) => {
		let n = t(e);
		if (n._tag === "Failure") throw zl(n.cause);
		return n.value;
	};
})(/*#__PURE__*/ Bs()), bf = /*#__PURE__*/ W(!0), xf = /*#__PURE__*/ W(!1), Sf = class {
	waiters = [];
	scheduled = void 0;
	_isOpen;
	constructor(e) {
		this._isOpen = e;
	}
	scheduleUnsafe(e) {
		if (this.waiters.length === 0) return bf;
		if (this.scheduled === void 0) this.scheduled = this.waiters, e.currentDispatcher.scheduleTask(this.flushScheduled, 0);
		else for (let e = 0; e < this.waiters.length; e++) this.scheduled.push(this.waiters[e]);
		return this.waiters = [], bf;
	}
	flushScheduled = () => {
		if (this.scheduled === void 0) return;
		let e = this.scheduled;
		this.scheduled = void 0;
		for (let t = 0; t < e.length; t++) e[t](Ju);
	};
	flushWaiters() {
		let e = this.waiters;
		this.waiters = [], this.flushScheduled();
		for (let t = 0; t < e.length; t++) e[t](Ju);
	}
	open = /*#__PURE__*/ H((e) => this._isOpen ? xf : (this._isOpen = !0, this.scheduleUnsafe(e)));
	release = /*#__PURE__*/ H((e) => this._isOpen ? xf : this.scheduleUnsafe(e));
	openUnsafe() {
		return !this._isOpen && (this._isOpen = !0, this.flushWaiters(), !0);
	}
	await = /*#__PURE__*/ fu((e) => this._isOpen ? e(q) : (this.waiters.push(e), G(() => {
		let t = this.waiters.indexOf(e);
		t === -1 ? this.scheduled !== void 0 && (t = this.scheduled.indexOf(e), t !== -1 && this.scheduled.splice(t, 1)) : this.waiters.splice(t, 1);
	})));
	closeUnsafe() {
		return this._isOpen ? (this._isOpen = !1, !0) : !1;
	}
	close = /*#__PURE__*/ G(() => this.closeUnsafe());
	whenOpen = (e) => Bu(this.await, () => e);
	isOpen() {
		return this._isOpen;
	}
}, Cf = (e) => new Sf(e ?? !1), wf = /*#__PURE__*/ BigInt(0), Tf = {
	_tag: "Span",
	spanId: "noop",
	traceId: "noop",
	sampled: !1,
	status: {
		_tag: "Ended",
		startTime: wf,
		endTime: wf,
		exit: Ju
	},
	attributes: /*#__PURE__*/ new Map(),
	links: [],
	kind: "internal",
	attribute() {},
	event() {},
	end() {},
	addLinks() {}
}, Ef = (e) => Object.assign(Object.create(Tf), e), Df = (e) => e ? Js(e.annotations, gl) ? e._tag === "Span" ? Df(bs(e.parent)) : gs() : _s(e) : gs(), Of = (e, t, n) => {
	let r = !e.cache.tracerEnabled || n?.annotations && Js(n.annotations, gl), i = n?.parent === void 0 ? n?.root ? gs() : Df(e.cache.span) : _s(n.parent), a;
	if (r) a = Ef({
		name: t,
		parent: i,
		annotations: Us(n?.annotations ?? Bs(), gl, !0)
	});
	else {
		let r = e.cache.tracer ?? bl, o = e.getRef(Mf), s = e.getRef(Tl), c = e.getRef(El), l = e.getRef(Dl), u = n?.level ?? e.getRef(_l), d = n?.links === void 0 ? l.length === 0 ? [] : l.slice() : [...l, ...n.links];
		a = r.span({
			name: t,
			parent: i,
			annotations: n?.annotations ?? Bs(),
			links: d,
			startTime: s ? o.currentTimeNanosUnsafe() : wf,
			kind: n?.kind ?? "internal",
			root: n?.root ?? vs(i),
			sampled: n?.sampled ?? (ys(i) && i.value.sampled === !1 ? !1 : !Uf(e.getRef(vl), u))
		});
		for (let e in c) a.attribute(e, c[e]);
		if (n?.attributes !== void 0) for (let e in n.attributes) a.attribute(e, n.attributes[e]);
	}
	return a;
}, kf = (e, t, n, r) => G(() => {
	e.status._tag !== "Ended" && e.end(r ? n.currentTimeNanosUnsafe() : wf, t);
}), Af = (e, ...t) => {
	let n = t.length === 1 ? void 0 : t[0], r = t[t.length - 1];
	return H((t) => {
		let i = Of(t, e, n), a = t.getRef(Mf), o = t.getRef(Tl);
		return Vd(t, (e) => kf(i, e, a, o)), r(i);
	});
}, jf = /*#__PURE__*/ id(ml), Mf = /*#__PURE__*/ ec("effect/Clock", { defaultValue: () => new Pf() }), Nf = 2 ** 31 - 1, Pf = class {
	currentTimeMillisUnsafe() {
		return Date.now();
	}
	currentTimeMillis = /*#__PURE__*/ G(() => this.currentTimeMillisUnsafe());
	currentTimeNanosUnsafe() {
		return Lf();
	}
	currentTimeNanos = /*#__PURE__*/ G(() => this.currentTimeNanosUnsafe());
	monotonicTimeNanosUnsafe() {
		return If();
	}
	monotonicTimeNanos = /*#__PURE__*/ G(() => this.monotonicTimeNanosUnsafe());
	sleep(e) {
		return this.sleepMillis(Kc(e));
	}
	sleepMillis(e) {
		return e <= 0 ? iu : Number.isFinite(e) ? fu((t) => {
			let n = e > Nf ? this.sleepMillis(e - Nf) : q, r = setTimeout(() => t(n), Math.min(e, Nf));
			return G(() => clearTimeout(r));
		}) : pu;
	}
}, Ff = /*#__PURE__*/ BigInt(1e6), If = /*#__PURE__*/ function() {
	let e = globalThis.process?.hrtime;
	if (typeof e?.bigint == "function") return () => e.bigint();
	if (typeof performance < "u" && typeof performance.now == "function") return () => BigInt(Math.round(performance.now() * 1e6));
	let t = /*#__PURE__*/ BigInt(0);
	return () => {
		let e = BigInt(Date.now()) * Ff;
		return e > t && (t = e), t;
	};
}(), Lf = /*#__PURE__*/ function() {
	let e = /*#__PURE__*/ BigInt(1e9), t;
	return () => {
		let n = If(), r = BigInt(Date.now()) * Ff;
		if (t === void 0) t = r - n;
		else {
			let i = t + n;
			(r > i ? r - i : i - r) > e && (t = r - n);
		}
		return t + n;
	};
}(), Rf = (e) => H((t) => e(t.getRef(Mf))), zf = (e) => Rf((t) => t.sleep(Oc(e))), Bf = "~effect/Cause/AsyncFiberError", Vf = class extends (/*#__PURE__*/ Fo("AsyncFiberError")) {
	[Bf] = Bf;
	constructor(e) {
		super({
			message: "An asynchronous Effect was executed with Effect.runSync",
			fiber: e
		});
	}
}, Hf = /*#__PURE__*/ ec("effect/Console", { defaultValue: () => globalThis.console }), Uf = /*#__PURE__*/ hs(/* @__PURE__ */ ms(ps, (e) => {
	switch (e) {
		case "All": return -(2 ** 53 - 1);
		case "Fatal": return 5e4;
		case "Error": return 4e4;
		case "Warn": return 3e4;
		case "Info": return 2e4;
		case "Debug": return 1e4;
		case "Trace": return 0;
		case "None": return 2 ** 53 - 1;
	}
})), Wf = {
	bold: "1",
	red: "31",
	green: "32",
	yellow: "33",
	blue: "34",
	cyan: "36",
	white: "37",
	gray: "90",
	black: "30",
	bgBrightRed: "101"
};
Wf.gray, Wf.blue, Wf.green, Wf.yellow, Wf.red, Wf.bgBrightRed, Wf.black;
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/Cause.js
var Gf = xo, Kf = go, qf = yo, Jf = Rl, Yf = Lo, Xf = Vo, Zf = V, Qf = Ao, $f = jo, ep = Ju, tp = Ku, np = {
	"~effect/Deferred": {
		_A: I,
		_E: I
	},
	pipe() {
		return xi(this, arguments);
	}
}, rp = function() {
	this.resumes = void 0, this.effect = void 0;
};
rp.prototype = np;
var ip = () => new rp(), ap = (e) => fu((t) => e.effect ? t(e.effect) : (e.resumes ??= [], e.resumes.push(t), G(() => {
	let n = e.resumes;
	if (n === void 0) return;
	let r = n.indexOf(t);
	r >= 0 && n.splice(r, 1);
}))), op = /* @__PURE__ */ F(2, (e, t) => G(() => lp(e, t))), sp = /*#__PURE__*/ F(2, (e, t) => op(e, Ao(t))), cp = /*#__PURE__*/ F(2, (e, t) => sp(e, Ml(t))), lp = (e, t) => {
	if (e.effect) return !1;
	if (e.effect = t, e.resumes) {
		let n = e.resumes;
		e.resumes = void 0;
		for (let e = 0; e < n.length; e++) n[e](t);
	}
	return !0;
}, up = Cd, dp = Pd, fp = Ld, pp = Ad, mp = jd, hp = kd, gp = wd, _p = "~effect/Layer", vp = "~effect/Layer/MemoMap", yp = (e, t) => {
	let n = {
		observers: 0,
		deferred: ip(),
		scope: dp(),
		finalizer: (r) => K(() => --n.observers > 0 ? q : (e.map.delete(t), gp(n.scope, r)))
	};
	return n;
}, bp = (e, t) => t.state._tag !== "Closed" && (e.observers++, Md(t, {}, e.finalizer), !0), xp = {
	[_p]: {
		_ROut: I,
		_E: I,
		_RIn: I
	},
	pipe() {
		return xi(this, arguments);
	}
}, Sp = (e) => {
	let t = Object.create(xp);
	return t.build = e, t;
}, Cp = (e) => Sp((t, n) => {
	let r = hp(n);
	return Hd(e(t, r), (e) => e._tag === "Failure" ? gp(r, e) : q);
}), wp = class {
	get [vp]() {
		return vp;
	}
	parent;
	constructor(e) {
		this.parent = e;
	}
	map = /*#__PURE__*/ new Map();
	get(e, t) {
		let n = this.map.get(e);
		return n ? (bp(n, t), n.deferred.effect ?? ap(n.deferred)) : this.parent?.get(e, t);
	}
	getOrElseMemoize(e, t, n) {
		return K(() => {
			let r;
			return Bd(K(() => {
				let i = this.get(e, t);
				if (i) return i;
				let a = yp(this, e);
				return bp(a, t) ? (r = a.deferred, this.map.set(e, a), n(this, a.scope)) : n(this, t);
			}), (e) => {
				r && lp(r, e);
			});
		});
	}
}, Tp = () => new wp(), Ep = (e) => new wp(e), Dp = class e extends (/*#__PURE__*/ Ss()("effect/Layer/CurrentMemoMap")) {
	static forkOrCreate(t) {
		let n = Gs(t, e);
		return n ? Ep(n) : Tp();
	}
}, Op = /*#__PURE__*/ F(3, (e, t, n) => id(Uu(e.build(t, n), Us(Dp, t)), Dp, t)), kp = /*#__PURE__*/ F(2, (e, t) => H((n) => Op(e, Dp.forkOrCreate(n.context), t))), Ap = function() {
	return arguments.length === 1 ? (e) => jp(Hs(arguments[0], e)) : jp(Hs(arguments[0], arguments[1]));
}, jp = (e) => Sp(wi(W(e))), Mp = (e, t, n) => {
	let r = hp(n, "parallel");
	return rf(e, (e) => e.build(t, hp(r, "sequential")), { concurrency: e.length }).pipe(Uu((e) => $s(...e)));
}, Np = (...e) => Cp((t, n) => Mp(e, t, n)), Pp = Mf, Fp = "~effect/DateTime", Ip = "~effect/DateTime/TimeZone", Lp = {
	[Fp]: Fp,
	pipe() {
		return xi(this, arguments);
	},
	[za]() {
		return this.toString();
	},
	toJSON() {
		return zp(this).toJSON();
	}
};
({ ...Lp }), { ...Lp };
var Rp = {
	[Ip]: Ip,
	[za]() {
		return this.toString();
	}
};
({ ...Rp }), { ...Rp };
var zp = (e) => new Date(e.epochMilliseconds), Bp = /*#__PURE__*/ F(2, (e, t) => dd(e, Wp, (e) => t(e))), Vp = (e) => e.reasons.some(Hp), Hp = (e) => e._tag === "Fail" && Yf(e.error), Up = (e) => {
	let t, n = !1;
	for (let r of e.reasons) Hp(r) ? t ??= r.error : r._tag !== "Interrupt" && (n = !0);
	return t === void 0 ? ic(e) : n ? ic(Kf(e.reasons.filter((e) => !Hp(e)))) : rc(t);
}, Wp = (e) => {
	let t = Up(e);
	return oc(t) ? t : rc(t.success.value);
}, Gp = (e) => {
	let t = Up(e);
	return oc(t) ? Qf(t.failure) : Zf(t.success.value);
}, Kp = (e, t, n) => Rd((r) => Bu(n?.local ? Op(t, Tp(), r) : kp(t, r), (t) => rd(e, t))), qp = /*#__PURE__*/ F((e) => ao(e[0]), (e, t, n) => Rs(t) ? rd(e, t) : Kp(e, Array.isArray(t) ? Np(...t) : t, n)), Jp = rf, Yp = nf, Y = W, Xp = K, X = G, Zp = q, Qp = fu, $p = mu, em = ru, tm = nu, nm = ou, rm = su, im = H, Z = Bu, am = Hu, om = Fu, sm = Iu, cm = yd, lm = Uu, um = Cu, dm = Lu, fm = md, pm = cd, mm = hd, hm = zf, gm = zu, _m = od, vm = gd, ym = ed, bm = nd, xm = qp, Sm = id, Cm = Wd, wm = Hd, Tm = qd, Em = Kd, Dm = Jd, Om = sd, km = pf, Am = ff, jm = gf, Mm = mf, Nm = yf, Pm = vf, Fm = hu, Im = vu, Lm = Wu, Rm = Vu, zm = bu, Bm = "~effect/BigDecimal", Vm = {
	[Bm]: Bm,
	[Gi]() {
		let e = Ym(this);
		return Ji(Qi(String(e.value)), Zi(e.scale));
	},
	[la](e) {
		return Hm(e) && eh(this, e) === 0;
	},
	toString() {
		return `BigDecimal(${nh(this)})`;
	},
	toJSON() {
		return {
			_id: "BigDecimal",
			value: String(this.value),
			scale: this.scale
		};
	},
	[za]() {
		return this.toJSON();
	},
	pipe() {
		return xi(this, arguments);
	}
}, Hm = (e) => L(e, Bm), Um = (e, t) => {
	if (!Number.isSafeInteger(t)) throw RangeError(`Scale must be a safe integer, got ${t}`);
	let n = Object.create(Vm);
	return n.value = e, n.scale = t, n;
}, Wm = (e, t) => {
	let n = Um(e, t);
	return n.normalized = n, n;
}, Gm = /*#__PURE__*/ BigInt(0), Km = /*#__PURE__*/ BigInt(1), qm = /*#__PURE__*/ BigInt(10), Jm = /*#__PURE__*/ Wm(Gm, 0), Ym = (e) => {
	if (e.normalized === void 0) {
		if (e.value === Gm) e.normalized = Jm;
		else {
			let t = `${e.value}`, n = t.length;
			for (; t[n - 1] === "0";) n--;
			e.normalized = Wm(BigInt(t.slice(0, n)), e.scale - (t.length - n));
		}
	}
	return e.normalized;
}, Xm = 100, Zm = [Km], Qm = (e, t) => e === t ? 0 : e < t ? -1 : 1, $m = (e, t) => {
	let n = `${e.value < Gm ? -e.value : e.value}`, r = `${t.value < Gm ? -t.value : t.value}`, i = BigInt(n.length - r.length) - BigInt(e.scale) + BigInt(t.scale);
	if (i !== Gm) return i < Gm ? -1 : 1;
	let a = Math.max(n.length, r.length);
	return fs(n.padEnd(a, "0"), r.padEnd(a, "0"));
}, eh = (e, t) => {
	if (e.scale === t.scale) return Qm(e.value, t.value);
	let n = th(e), r = th(t);
	if (n !== r) return n < r ? -1 : 1;
	if (n === 0) return 0;
	let i = e.scale - t.scale, a = Math.abs(i);
	if (a > Xm) return n === -1 ? $m(t, e) : $m(e, t);
	let o = Zm[a] ??= qm ** BigInt(a);
	return i > 0 ? Qm(e.value, t.value * o) : Qm(e.value * o, t.value);
}, th = (e) => e.value === Gm ? 0 : e.value < Gm ? -1 : 1, nh = (e) => {
	let t = Ym(e);
	if (Math.abs(t.scale) >= 16) return rh(t);
	let n = t.value < Gm, r = `${n ? -t.value : t.value}`, i = t.scale > 0 ? r.padStart(t.scale + 1, "0") : r.padEnd(r.length - t.scale, "0"), a = i.length - t.scale, o = t.scale > 0 ? `${i.slice(0, a)}.${i.slice(a)}` : i;
	return n ? `-${o}` : o;
}, rh = (e) => {
	if (ih(e)) return "0e+0";
	let t = Ym(e), n = `${t.value}`, r = t.value < Gm ? 2 : 1, i = n.slice(0, r), a = n.slice(r), o = a.length - t.scale;
	return `${i}${a === "" ? "" : `.${a}`}e${o >= 0 ? "+" : ""}${o}`;
}, ih = (e) => e.value === Gm, ah = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", oh = /*#__PURE__*/ (/* @__PURE__ */ new Uint8Array(123)).fill(255);
for (let e = 0; e < 64; e++) oh[/*#__PURE__*/ ah.charCodeAt(e)] = e;
oh[61] = 0, { ...Va }, { ...Va }, { ...ro };
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/internal/schema/annotations.js
function sh(e) {
	return e.checks ? e.checks[e.checks.length - 1].annotations : e.annotations;
}
var ch = "~sentinels", lh = "~constructor", uh = /*#__PURE__*/ ki((e) => {
	let t = sh(e)?.identifier;
	return typeof t == "string" ? t : e.getExpected(uh);
}), Q = /*#__PURE__*/ Symbol(), dh = Zf, fh = /*#__PURE__*/ dh(Q), $ = /*#__PURE__*/ dh(Q), ph = (e) => e === Q ? gs() : _s(e), mh = (e) => e._tag === "None" ? fh : dh(e.value), hh = "~effect/SchemaIssue/Issue";
function gh(e) {
	return L(e, hh) && e[hh] === hh;
}
function _h(e) {
	return Object.hasOwn(e, "input");
}
var vh = class {
	[hh] = hh;
	constructor(e, t) {
		t?.reportInput === !0 && e !== Q && (this.input = e);
	}
}, yh = class extends vh {
	_tag = "Filter";
	filter;
	issue;
	constructor(e, t, n, r) {
		super(n, r), this.filter = e, this.issue = t;
	}
}, bh = class extends vh {
	_tag = "Encoding";
	ast;
	issue;
	constructor(e, t, n, r) {
		super(n, r), this.ast = e, this.issue = t;
	}
}, xh = class extends vh {
	_tag = "Pointer";
	path;
	issue;
	constructor(e, t) {
		super(), this.path = e, this.issue = t;
	}
}, Sh = class extends vh {
	_tag = "MissingKey";
	annotations;
	constructor(e) {
		super(), this.annotations = e;
	}
}, Ch = class extends vh {
	_tag = "UnexpectedKey";
	ast;
	constructor(e, t, n) {
		super(t, n), this.ast = e;
	}
}, wh = class extends vh {
	_tag = "Composite";
	ast;
	issues;
	constructor(e, t, n, r) {
		super(n, r), this.ast = e, this.issues = t;
	}
}, Th = class extends vh {
	_tag = "InvalidType";
	ast;
	constructor(e, t, n) {
		super(t, n), this.ast = e;
	}
}, Eh = class extends vh {
	_tag = "InvalidValue";
	annotations;
	constructor(e, t, n) {
		super(t, n), this.annotations = e;
	}
}, Dh = class extends vh {
	_tag = "AnyOf";
	ast;
	issues;
	constructor(e, t, n, r) {
		super(n, r), this.ast = e, this.issues = t;
	}
}, Oh = class extends vh {
	_tag = "OneOf";
	ast;
	successes;
	constructor(e, t, n, r) {
		super(n, r), this.ast = e, this.successes = t;
	}
};
function kh(e, t, n) {
	if (gh(e)) return e;
	if (typeof e == "string") return new Eh({ message: e }, t, n);
	let r = typeof e.issue == "string" ? new Eh({ message: e.issue }, t, n) : e.issue;
	return new xh(e.path, r);
}
function Ah(e, t, n) {
	if (e !== void 0) return typeof e == "boolean" ? e ? void 0 : new Eh(void 0, t, n) : kh(e, t, n);
}
function jh(e, t, n, r) {
	return Array.isArray(t) ? pc(t) ? t.length === 1 ? kh(t[0], n, r) : new wh(e, _c(t, (e) => kh(e, n, r)), n, r) : void 0 : Ah(t, n, r);
}
var Mh = (e) => {
	let t = Vh(e);
	if (t !== void 0) return t;
	switch (e._tag) {
		case "InvalidType": return Ih(uh(e.ast), e);
		case "InvalidValue": {
			let t = Fh(e);
			if (t !== void 0) return Ih(t, e);
			let n = Ph(e);
			return n === void 0 ? "Expected a valid value" : `Invalid data ${n}`;
		}
		case "MissingKey": return "Missing key";
		case "UnexpectedKey": {
			let t = Ph(e);
			return t === void 0 ? "Expected no excess property" : `Unexpected key with value ${t}`;
		}
		case "Forbidden": return "Forbidden operation";
		case "OneOf": {
			let t = Ph(e);
			return t === void 0 ? "Expected exactly one member to match" : `Expected exactly one member to match the input ${t}`;
		}
	}
}, Nh = (e) => Vh(e.issue) ?? Vh(e);
function Ph(e) {
	return _h(e) ? Ma(e.input) : void 0;
}
function Fh(e) {
	let t = e.annotations?.expected;
	return typeof t == "string" ? t : void 0;
}
function Ih(e, t) {
	let n = Ph(t);
	return n === void 0 ? `Expected ${e}` : `Expected ${e}, got ${n}`;
}
function Lh(e) {
	let t = e.annotations?.expected;
	if (typeof t == "string") return t;
	switch (e._tag) {
		case "Filter": return "<filter>";
		case "FilterGroup": return e.checks.map((e) => Lh(e)).join(" & ");
	}
}
function Rh() {
	return (e) => Bh(e, "");
}
var zh = /*#__PURE__*/ Rh();
function Bh(e, t) {
	let n;
	switch (e._tag) {
		case "Filter": {
			let r = Nh(e);
			if (r !== void 0) n = r;
			else {
				if (e.issue._tag !== "InvalidValue") return Bh(e.issue, t);
				let r = Fh(e.issue);
				n = r === void 0 ? Ih(Lh(e.filter), e) : Ih(r, e.issue);
			}
			break;
		}
		case "Encoding": return Bh(e.issue, t);
		case "Pointer": return Bh(e.issue, t + Fa(e.path));
		case "Composite":
		case "AnyOf":
			if (e._tag === "Composite" || e.issues.length > 0) return e.issues.map((e) => Bh(e, t)).join("\n");
			n = Vh(e) ?? Ih(uh(e.ast), e);
			break;
		default: n = Mh(e);
	}
	return t ? `${n}\n  at ${t}` : n;
}
function Vh(e) {
	if (e._tag === "Pointer") return;
	if (e._tag === "Encoding") return Vh(e.issue);
	let t = (e._tag === "Filter" ? e.filter.annotations : "annotations" in e ? e.annotations : e.ast.annotations)?.[e._tag === "MissingKey" ? "messageMissingKey" : e._tag === "UnexpectedKey" ? "messageUnexpectedKey" : "message"];
	if (typeof t == "string") return t;
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/internal/schema/cause.js
function Hh(e) {
	let t;
	for (let n of e.reasons) {
		if (!Gf(n) || !gh(n.error)) return;
		t ??= n.error;
	}
	return t;
}
function Uh(e, t) {
	let n = Hh(e);
	if (n === void 0) throw Error(t, { cause: e });
	return n;
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/SchemaGetter.js
var Wh = (e) => Object.assign(Object.create(Si), e), Gh = /*#__PURE__*/ Wh({ _tag: "Passthrough" });
function Kh() {
	return Gh;
}
function qh(e) {
	return Wh({
		_tag: "Transform",
		transform: e
	});
}
function Jh() {
	return qh(globalThis.String);
}
function Yh() {
	return qh(globalThis.Number);
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/SchemaTransformation.js
var Xh = class extends Ci {
	_tag = "Middleware";
	decode;
	encode;
	constructor(e, t) {
		super(), this.decode = e, this.encode = t;
	}
	flip() {
		return new Xh(this.encode, this.decode);
	}
}, Zh = "~effect/SchemaTransformation/Transformation", Qh = class extends Ci {
	[Zh] = Zh;
	_tag = "Transformation";
	decode;
	encode;
	constructor(e, t) {
		super(), this.decode = e, this.encode = t;
	}
	flip() {
		return new Qh(this.encode, this.decode);
	}
};
function $h(e) {
	return L(e, Zh) && e[Zh] === Zh;
}
var eg = (e) => $h(e) ? e : new Qh(e.decode, e.encode), tg = /*#__PURE__*/ new Qh(/*#__PURE__*/ Kh(), /*#__PURE__*/ Kh());
function ng() {
	return tg;
}
var rg = /*#__PURE__*/ new Qh(/*#__PURE__*/ Yh(), /*#__PURE__*/ Jh());
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/SchemaAST.js
function ig(e) {
	return (t) => t._tag === e;
}
var ag = /*#__PURE__*/ ig("Declaration"), og = /*#__PURE__*/ ig("Never"), sg = /*#__PURE__*/ ig("Literal"), cg = /*#__PURE__*/ ig("UniqueSymbol"), lg = /*#__PURE__*/ ig("Arrays"), ug = /*#__PURE__*/ ig("Objects"), dg = /*#__PURE__*/ ig("Suspend"), fg = class {
	to;
	transformation;
	constructor(e, t) {
		this.to = e, this.transformation = t;
	}
}, pg = {}, mg = class {
	isOptional;
	isMutable;
	constructorDefault;
	annotations;
	constructor(e, t, n = void 0, r = void 0) {
		this.isOptional = e, this.isMutable = t, this.constructorDefault = n, this.annotations = r;
	}
}, hg = "~effect/Schema", gg = class {
	[hg] = hg;
	annotations;
	checks;
	encoding;
	context;
	constructor(e = void 0, t = void 0, n = void 0, r = void 0) {
		this.annotations = e, this.checks = t, this.encoding = n, this.context = r;
	}
	toString() {
		return `<${this._tag}>`;
	}
}, _g = class extends gg {
	_tag = "Declaration";
	typeParameters;
	run;
	encodingChecks;
	encodingRun;
	constructor(e, t, n, r, i, a, o, s) {
		super(n, r, i, a), this.typeParameters = e, this.run = t, this.encodingChecks = o, this.encodingRun = s;
	}
	getParser() {
		let e;
		return (t, n) => t === Q ? fh : (e ??= this.run(this.typeParameters))(t, this, n);
	}
	_rebuild(e, t, n, r, i) {
		let a = j_(this.typeParameters, e);
		return a === this.typeParameters && t === this.checks && n === this.encodingChecks && r === this.run && i === this.encodingRun ? this : new _g(a, r, this.annotations, t, void 0, this.context, n, i);
	}
	recur(e) {
		return this._rebuild(e, this.checks, this.encodingChecks, this.run, this.encodingRun);
	}
	flip(e) {
		return this._rebuild(e, this.encodingChecks, this.checks, this.encodingRun ?? this.run, this.run);
	}
	getExpected() {
		let e = this.annotations?.expected;
		return typeof e == "string" ? e : "<Declaration>";
	}
}, vg = /*#__PURE__*/ new class extends gg {
	_tag = "Unknown";
	getParser() {
		return J_(this, Hi);
	}
	getExpected() {
		return "unknown";
	}
}(), yg = class extends gg {
	_tag = "Literal";
	literal;
	constructor(e, t, n, r, i) {
		if (super(t, n, r, i), typeof e == "number" && !globalThis.Number.isFinite(e)) throw Error(`A numeric literal must be finite, got ${Ma(e)}`);
		this.literal = e;
	}
	getParser() {
		return q_(this, this.literal);
	}
	matchPart(e, t) {
		return e === globalThis.String(this.literal) ? this.literal : void 0;
	}
	toCodecJson() {
		return typeof this.literal == "bigint" ? bg(this) : this;
	}
	toCodecStringTree() {
		return typeof this.literal == "string" ? this : bg(this);
	}
	getExpected() {
		return typeof this.literal == "string" ? JSON.stringify(this.literal) : globalThis.String(this.literal);
	}
};
function bg(e) {
	let t = globalThis.String(e.literal);
	return b_(e, [new fg(new yg(t), new Qh(qh(() => e.literal), qh(() => t)))]);
}
var xg = /*#__PURE__*/ new class extends gg {
	_tag = "String";
	getParser() {
		return J_(this, Ii);
	}
	matchPart(e, t) {
		let n = this.checks;
		return n && !t.disableChecks && nv(n, e, void 0, this, t) ? void 0 : e;
	}
	getExpected() {
		return "string";
	}
}(), Sg = class extends gg {
	_tag = "Number";
	getParser() {
		return J_(this, Li);
	}
	matchKey(e, t) {
		return this._match(Z_, e, t);
	}
	matchPart(e, t) {
		return this._match(X_, e, t);
	}
	_match(e, t, n) {
		if (!e.test(t)) return;
		let r = globalThis.Number(t);
		return n.disableChecks || !this.checks ? r : nv(this.checks, r, void 0, this, n) ? void 0 : r;
	}
	toCodecJson() {
		return this.checks && (Cg(this.checks, "effect/schema/isFinite") || Cg(this.checks, "effect/schema/isInt")) ? this : b_(this, [h_]);
	}
	toCodecStringTree() {
		return this.toCodecJson() === this ? b_(this, [ev]) : b_(this, [tv]);
	}
	getExpected() {
		return "number";
	}
};
function Cg(e, t) {
	return e.some((e) => e.annotations?.representation?.id === t || e._tag === "FilterGroup" && Cg(e.checks, t));
}
var wg = /*#__PURE__*/ new Sg(), Tg = class extends gg {
	_tag = "Arrays";
	isMutable;
	elements;
	rest;
	encodingChecks;
	constructor(e, t, n, r, i, a, o, s) {
		super(r, i, a, o), this.isMutable = e, this.elements = t, this.rest = n, this.encodingChecks = s;
		let c = !1;
		for (let e = 0; e < t.length; e++) if (R_(t[e])) c = !0;
		else if (c) throw Error("A required element cannot follow an optional element. ts(1257)");
		if (c && n.length > 1) throw Error("A required element cannot follow an optional element. ts(1257)");
		for (let e = 1; e < n.length; e++) if (R_(n[e])) throw Error("An optional element cannot follow a rest element. ts(1266)");
	}
	getParser(e, t = e) {
		let n = this, r, i, a = n.elements.length, o = Math.max(0, n.rest.length - 1);
		function s(e, t) {
			return t < a ? r[t] : t >= e ? i[t - e + 1] : i[0];
		}
		let c = (e) => {
			let { input: t, len: r, options: i } = e;
			if (n.rest.length === 0 && r > a) for (let o = a; o < r; o++) {
				let r = new Ch(n, t[o], i), a = new xh([o], r);
				if (i.errors === "all") e.issues ? e.issues.push(a) : e.issues = [a];
				else return em(new wh(n, [a], t, i));
			}
			return e.issues ? em(new wh(n, e.issues, t, i)) : dh(e.output);
		}, l = (e, t) => {
			let r = e.length, i = {
				ast: n,
				getParser: s,
				input: e,
				len: r,
				tailThreshold: Math.max(a, r - o),
				output: new globalThis.Array(r),
				issues: void 0,
				options: t
			}, u = n.rest.length === 0 ? a : Math.max(r, a + o), d = t.concurrency === void 0 ? 1 : of(t.concurrency), f = d === 1 ? Og(i, e, 0, u) : kg(i, e, {
				concurrency: d,
				end: u
			});
			if (!f) return c(i);
			if (J(f)) return Rm(f, () => c(i));
			let p = !0;
			return Xp(() => p ? (p = !1, Z(f, () => c(i))) : l(e, t));
		};
		return (e, a) => {
			if (e === Q) return fh;
			try {
				return Array.isArray(e) ? (r || (r = n.elements.map((e) => ({
					ast: e,
					parser: t(e)
				})), i = n.rest.map((e) => ({
					ast: e,
					parser: t(e)
				}))), l(e, a)) : em(new Th(n, e, a));
			} catch (e) {
				return rm(e);
			}
		};
	}
	_rebuild(e, t, n) {
		let r = j_(this.elements, e), i = j_(this.rest, e);
		return r === this.elements && i === this.rest && t === this.checks && n === this.encodingChecks ? this : new Tg(this.isMutable, r, i, this.annotations, t, void 0, this.context, n);
	}
	recur(e) {
		return this._rebuild(e, this.checks, this.encodingChecks);
	}
	flip(e) {
		return this._rebuild(e, this.encodingChecks, this.checks);
	}
	getExpected() {
		return "array";
	}
};
function Eg(e, t, n, r) {
	if (n._tag === "Failure") return Ag(e, e.ast, r, n);
	let i = n === $ ? t : n[z];
	if (i !== Q) e.output[r] = i;
	else {
		let t = e.getParser(e.tailThreshold, r);
		if (R_(t.ast)) return;
		let n = new xh([r], new Sh(t.ast.context?.annotations));
		if (e.options.errors === "all") e.issues ? e.issues.push(n) : e.issues = [n];
		else return $f(new wh(e.ast, [n], e.input, e.options));
	}
}
var Dg = {
	onItem(e, t, n) {
		let r = n < e.len ? t : Q;
		return e.getParser(e.tailThreshold, n).parser(r, e.options);
	},
	step: Eg
}, Og = /*#__PURE__*/ sf()(Dg), kg = /*#__PURE__*/ lf()(Dg), Ag = (e, t, n, r) => {
	if (r.cause.reasons.length === 0) return r;
	let i = Hh(r.cause);
	if (i === void 0) return Qf(Jf(r.cause, (r) => new wh(t, [new xh([n], r)], e.input, e.options)));
	let a = new xh([n], i);
	if (e.options.errors === "all") e.issues ? e.issues.push(a) : e.issues = [a];
	else return $f(new wh(t, [a], e.input, e.options));
}, jg = "[+-]?\\d*\\.?\\d+(?:[Ee][+-]?\\d+)?";
function Mg(e, t, n = pg) {
	let r, i;
	function a(t) {
		switch (t._tag) {
			case "String":
			case "TemplateLiteral": return (r ??= Object.keys(e)).filter((e) => t.matchPart(e, n) !== void 0);
			case "Number": return (r ??= Object.keys(e)).filter((e) => t.matchKey(e, n) !== void 0);
			case "Symbol": return (i ??= Object.getOwnPropertySymbols(e)).filter((r) => Object.prototype.propertyIsEnumerable.call(e, r) && t.matchKey(r, n) !== void 0);
			case "Union": return [...new Set(t.types.flatMap(a))];
			default: return [];
		}
	}
	return a(Y_(U_(t)));
}
var Ng = class {
	name;
	type;
	constructor(e, t) {
		this.name = e, this.type = t;
	}
};
function Pg(e) {
	switch (e._tag) {
		case "String":
		case "Number":
		case "Symbol":
		case "TemplateLiteral": return !0;
		case "Union": return e.types.every(Pg);
		default: return !1;
	}
}
function Fg(e) {
	let t = S_(e);
	switch (t._tag) {
		case "String":
		case "Number":
		case "Symbol":
		case "TemplateLiteral": return !0;
		case "Union": return t.types.every(Fg);
		default: return !1;
	}
}
function Ig(e) {
	return Pg(e) && Fg(e);
}
var Lg = class {
	parameter;
	type;
	constructor(e, t) {
		if (!Ig(e)) throw Error(`Invalid index signature parameter ${e._tag}`);
		if (this.parameter = e, this.type = t, R_(t) && !K_(t)) throw Error("Cannot use `Schema.optionalKey` with index signatures, use `Schema.optional` instead.");
	}
}, Rg = class extends gg {
	_tag = "Objects";
	propertySignatures;
	indexSignatures;
	encodingChecks;
	constructor(e, t, n, r, i, a, o) {
		super(n, r, i, a), this.propertySignatures = e, this.indexSignatures = t, this.encodingChecks = o;
	}
	getParser(e, t = e) {
		let n = this, r = n.propertySignatures.length, i = n.indexSignatures.length;
		if (!r && !i) return J_(n, Vi);
		let a, o, s = () => (a || (a = n.propertySignatures.map((e) => ({
			parser: t(e.type),
			name: e.name,
			type: e.type
		})), o = i ? n.indexSignatures.map((n) => ({
			is: n,
			parserKey: e(Y_(n.parameter)),
			parserValue: t(n.type)
		})) : void 0), a), c = () => {
			let e = new Set(n.propertySignatures.map((e) => typeof e.name == "number" ? globalThis.String(e.name) : e.name)), t = (t, i, a, o, s) => {
				if (s._tag === "Failure") return Ag(t, n, i, s) ?? ep;
				let c = s === $ ? o : s[z];
				if (a !== Q && c !== Q) {
					if (r && (e.has(i) || e.has(typeof a == "number" ? globalThis.String(a) : a))) return ep;
					qa(t.out, a, c);
				}
				return ep;
			}, c = (e, r, i, a) => {
				if (!a) {
					let t = i.parserKey(r, e.options);
					if (!J(t)) return Z(cm(t), (t) => c(e, r, i, t));
					a = t;
				}
				if (a._tag === "Failure") return Ag(e, n, r, a) ?? ep;
				let o = a === $ ? r : a[z], s = e.input[r], l = i.parserValue(s, e.options);
				return J(l) ? t(e, r, o, s, l) : Z(cm(l), (n) => t(e, r, o, s, n));
			}, l = (e, n, r) => {
				let i = e.input[n], a = r.parserValue(i, e.options);
				return J(a) ? t(e, n, n, i, a) : Z(cm(a), (r) => t(e, n, n, i, r));
			}, u = i ? lf()({
				onItem: (e, [t, n]) => n.is.parameter === xg ? l(e, t, n) : c(e, t, n),
				step: (e, t, n) => n._tag === "Failure" ? n : void 0
			}) : void 0;
			return zm(function* (t, d) {
				if (t === Q) return Q;
				if (typeof t != "object" || !t || Array.isArray(t)) return yield* em(new Th(n, t, d));
				s();
				let f = t, p = {}, m = {
					ast: n,
					input: f,
					out: p,
					issues: void 0,
					options: d
				}, h = d.errors === "all", g = d.onExcessProperty === "error", _ = d.concurrency === void 0 ? 1 : of(d.concurrency), v = i && g ? n.indexSignatures.map((e) => Mg(f, e.parameter, d)) : void 0;
				if (g) {
					let r = v ? new Set(e) : e;
					if (v) for (let e of v) for (let t of e) r.add(t);
					let i = Reflect.ownKeys(f);
					for (let e = 0; e < i.length; e++) {
						let a = i[e];
						if (!r.has(a) && Object.prototype.propertyIsEnumerable.call(f, a)) {
							let e = new Ch(n, f[a], d), r = new xh([a], e);
							if (h) {
								m.issues ? m.issues.push(r) : m.issues = [r];
								continue;
							}
							return yield* em(new wh(n, [r], t, d));
						}
					}
				}
				if (r) {
					let e = _ === 1 ? Vg(m, a) : Hg(m, a, { concurrency: _ });
					e && (yield* e);
				}
				if (i && _ === 1) for (let e = 0; e < i; e++) {
					let t = o[e], n = t.is.parameter === xg ? l : c, r = v?.[e] ?? (t.is.parameter === xg ? Object.keys(f) : Mg(f, t.is.parameter, d));
					for (let e = 0; e < r.length; e++) {
						let i = n(m, r[e], t);
						if (!J(i)) yield* i;
						else if (i._tag === "Failure") return yield* i;
					}
				}
				else if (u) {
					let e = hc();
					for (let t = 0; t < i; t++) {
						let n = o[t], r = v?.[t] ?? (n.is.parameter === xg ? Object.keys(f) : Mg(f, n.is.parameter, d));
						for (let t = 0; t < r.length; t++) e.push([r[t], n]);
					}
					let t = u(m, e, { concurrency: _ });
					t && (yield* t);
				}
				return m.issues ? yield* em(new wh(n, m.issues, t, d)) : p;
			});
		};
		if (i) return c();
		let l, u = (e, t, n) => {
			let r = a[t];
			return Z(cm(n), (n) => {
				let i = zg(e, r, n);
				if (i) return i;
				let o = () => dh(e.out), s = Vg(e, a.slice(t + 1));
				return s ? Rm(s, o) : o();
			});
		};
		return (e, t) => {
			if (e === Q) return fh;
			if (t.errors === "all" || t.onExcessProperty !== void 0 || t.concurrency !== void 0 && of(t.concurrency) !== 1) return (l ??= c())(e, t);
			if (typeof e != "object" || !e || Array.isArray(e)) return em(new Th(n, e, t));
			let r = s(), i = e, a = {}, o = {
				ast: n,
				input: i,
				out: a,
				issues: void 0,
				options: t
			};
			try {
				for (let e = 0; e < r.length; e++) {
					let n = r[e], s = n.name, c = $g(i, s), l = c ? i[s] : Q, d = n.parser(l, t);
					if (!J(d)) return u(o, e, d);
					if (d === $) {
						c && qa(a, s, l);
						continue;
					}
					let f = zg(o, n, d);
					if (f) return f;
				}
			} catch (e) {
				return rm(e);
			}
			return dh(a);
		};
	}
	_rebuild(e, t, n, r) {
		let i = j_(this.propertySignatures, (t) => {
			let n = e(t.type);
			return n === t.type ? t : new Ng(t.name, n);
		}), a = j_(this.indexSignatures, (n) => {
			let r = t(n.parameter), i = e(n.type);
			return r === n.parameter && i === n.type ? n : new Lg(r, i);
		});
		return i === this.propertySignatures && a === this.indexSignatures && n === this.checks && r === this.encodingChecks ? this : new Rg(i, a, this.annotations, n, void 0, this.context, r);
	}
	flip(e) {
		return this._rebuild(e, e, this.encodingChecks, this.checks);
	}
	recur(e, t = e) {
		return this._rebuild(e, t, this.checks, this.encodingChecks);
	}
	getExpected() {
		return this.propertySignatures.length === 0 && this.indexSignatures.length === 0 ? "object | array" : "object";
	}
};
function zg(e, t, n) {
	if (n._tag === "Failure") return Ag(e, e.ast, t.name, n);
	if (n === $) return;
	let r = n[z];
	if (r !== Q) {
		qa(e.out, t.name, r);
		return;
	}
	if (delete e.out[t.name], !R_(t.type)) {
		let n = new xh([t.name], new Sh(t.type.context?.annotations));
		if (e.options.errors === "all") {
			e.issues ? e.issues.push(n) : e.issues = [n];
			return;
		}
		return $f(new wh(e.ast, [n], e.input, e.options));
	}
}
var Bg = {
	onItem(e, t) {
		if (!$g(e.input, t.name)) return t.parser(Q, e.options);
		let n = e.input[t.name];
		return qa(e.out, t.name, n), t.parser(n, e.options);
	},
	step: zg
}, Vg = /*#__PURE__*/ sf()(Bg), Hg = /*#__PURE__*/ lf()(Bg);
function Ug(e, t) {
	return e ? t ? [...e, ...t] : e : t;
}
function Wg(e, t, n) {
	return new Rg(Reflect.ownKeys(e).map((t) => new Ng(t, e[t].ast)), [], n, t);
}
function Gg(e) {
	return e.ast;
}
function Kg(e, t, n) {
	return new t_(e.map(Gg), t, void 0, n);
}
var qg = /*#__PURE__*/ Ai((e) => {
	for (;;) {
		if (dg(e)) return vg;
		let t = e.encoding;
		if (!t) return e.recur?.(qg, I) ?? e;
		if (t.some((e) => e.transformation._tag === "Middleware" && e.transformation.decode !== I)) return vg;
		e = t[t.length - 1].to;
	}
});
function Jg(e) {
	switch (e._tag) {
		case "Null": return ["null"];
		case "Undefined": return ["undefined"];
		case "String":
		case "TemplateLiteral": return ["string"];
		case "Number": return ["number"];
		case "Boolean": return ["boolean"];
		case "Symbol":
		case "UniqueSymbol": return ["symbol"];
		case "BigInt": return ["bigint"];
		case "Arrays": return ["array"];
		case "ObjectKeyword": return [
			"object",
			"array",
			"function"
		];
		case "Objects": return e.propertySignatures.length || e.indexSignatures.length ? ["object"] : [
			"string",
			"number",
			"boolean",
			"symbol",
			"bigint",
			"object",
			"array",
			"function"
		];
		case "Enum": return Array.from(new Set(e.enums.map(([, e]) => typeof e)));
		case "Literal": return [typeof e.literal];
		case "Union": return Array.from(new Set(e.types.flatMap(Jg)));
		default: return [
			"null",
			"undefined",
			"string",
			"number",
			"boolean",
			"symbol",
			"bigint",
			"object",
			"array",
			"function"
		];
	}
}
function Yg(e) {
	switch (e._tag) {
		default: return [];
		case "Declaration": {
			let t = e.annotations?.[ch];
			return Array.isArray(t) ? t : [];
		}
		case "Objects": return e.propertySignatures.flatMap((e) => {
			let t = e.type;
			if (!R_(t)) {
				if (sg(t)) return [{
					key: e.name,
					literal: t.literal
				}];
				if (cg(t)) return [{
					key: e.name,
					literal: t.symbol
				}];
			}
			return [];
		});
		case "Arrays": return e.elements.flatMap((e, t) => {
			if (!R_(e)) {
				if (sg(e)) return [{
					key: t,
					literal: e.literal
				}];
				if (cg(e)) return [{
					key: t,
					literal: e.symbol
				}];
			}
			return [];
		});
		case "Union": {
			if (e.types.length === 0) return [];
			let t = e.types.map((e) => Yg(qg(e)));
			return t[0].filter((e) => t.every((t) => t.some((t) => t.key === e.key && t.literal === e.literal)));
		}
		case "Suspend": return Yg(e.thunk());
	}
}
var Xg = /*#__PURE__*/ new WeakMap(), Zg = /*#__PURE__*/ Object.freeze([]), Qg = (e) => e === null ? "null" : Array.isArray(e) ? "array" : typeof e, $g = (e, t) => t === "__proto__" ? Object.hasOwn(e, t) : t in e;
function e_(e) {
	let t = Xg.get(e);
	if (t) return t;
	let n, r = 0, i, a, o = !0, s = [];
	for (let t = 0; t < e.length; t++) {
		let c = e[t], l = qg(c);
		if (og(l)) continue;
		if (sg(l) || cg(l)) {
			a ??= /* @__PURE__ */ new Map();
			let e = sg(l) ? l.literal : l.symbol;
			s[t] = e;
			let n = a.get(e);
			n || a.set(e, n = []), n.push(t);
		} else o = !1;
		let u = Yg(l);
		if (u.length) {
			n ??= /* @__PURE__ */ new Map(), r++;
			for (let { key: e, literal: r } of u) {
				let i = n.get(e);
				i || n.set(e, i = [/* @__PURE__ */ new Map(), /* @__PURE__ */ new Set()]), i[1].add(t);
				let a = i[0].get(r);
				a || i[0].set(r, a = /* @__PURE__ */ new Set()), a.add(t);
			}
		} else {
			i ??= {};
			let e = Jg(l);
			for (let n of e) (i[n] ??= []).push(t);
		}
	}
	let c = {}, l = (e) => c[e] ??= Object.freeze(i?.[e] ?? Zg);
	if (o && a) a.forEach(Object.freeze), t = (e) => a.get(e) ?? Zg;
	else if (n?.size === 1 && !i) {
		let [r, [i]] = n.entries().next().value, a = /* @__PURE__ */ new Map();
		for (let [e, t] of i) a.set(e, Object.freeze(Array.from(t)));
		let o = Object.freeze(e.map((e, t) => t));
		t = (e, t) => {
			if (Ui(e)) {
				let n = $g(e, r) ? e[r] : void 0;
				if (n !== void 0) return a.get(n) ?? Zg;
				if (t) return o;
			}
			return Zg;
		};
	} else if (n) {
		let e;
		for (let t of n) (!e || t[1][0].size > e[1][0].size) && t[1][1].size === r && (e = t);
		t = (t, r) => {
			let a = Qg(t);
			if (!Ui(t)) return l(a);
			let o = new Set(i?.[a]), s;
			if (e) {
				let [n, [i]] = e, c = $g(t, n), u = c ? t[n] : void 0;
				if (c && (!r || u !== void 0)) {
					let e = i.get(u);
					if (!e) return l(a);
					for (let t of e) o.add(t);
					s = n;
				}
			}
			if (s === void 0) for (let [e, [i, a]] of n) {
				let n = $g(t, e), s = n ? t[e] : void 0;
				if (n && (!r || s !== void 0)) {
					let e = i.get(s);
					if (e) for (let t of e) o.add(t);
				} else if (r) for (let e of a) o.add(e);
			}
			for (let [e, [i, a]] of n) {
				if (e === s) continue;
				let n = $g(t, e), c = n ? t[e] : void 0;
				if (n && (!r || c !== void 0)) {
					let e = i.get(c);
					for (let t of o) a.has(t) && !e?.has(t) && o.delete(t);
				}
			}
			return Array.from(o).sort((e, t) => e - t);
		};
	} else t = (e) => {
		let t = l(Qg(e));
		return a ? t.filter((t) => s[t] === void 0 || s[t] === e) : t;
	};
	return Xg.set(e, t), t;
}
var t_ = class extends gg {
	_tag = "Union";
	types;
	options;
	encodingChecks;
	constructor(e, t, n, r, i, a, o) {
		super(n, r, i, a), this.types = e, this.options = t, this.encodingChecks = o;
	}
	getParser(e, t) {
		let n = this, r = t !== void 0, i = [], a = (t) => i[t] ??= e(n.types[t]), o;
		return (e, t) => {
			if (e === Q) return fh;
			let i = (o ??= e_(n.types))(e, r);
			if (i.length === 0) return em(new Dh(n, [], e, t));
			if (i.length === 1) {
				let r = a(i[0])(e, t);
				return r._tag === "Success" ? r : J(r) ? n_(n, r.cause, e, t) : r_(n, r, e, t);
			}
			return i_(n, a, i, e, t);
		};
	}
	_rebuild(e, t, n) {
		let r = j_(this.types, e);
		return r === this.types && t === this.checks && n === this.encodingChecks ? this : new t_(r, this.options, this.annotations, t, void 0, this.context, n);
	}
	recur(e) {
		return this._rebuild(e, this.checks, this.encodingChecks);
	}
	flip(e) {
		return this._rebuild(e, this.encodingChecks, this.checks);
	}
	matchPart(e, t) {
		for (let n of this.types) {
			let r = n.matchPart(e, t);
			if (r !== void 0) return r;
		}
	}
	getExpected(e) {
		let t = this.annotations?.expected;
		if (typeof t == "string") return t;
		if (this.types.length === 0) return "never";
		let n = this.types.map((t) => {
			let n = U_(t);
			switch (n._tag) {
				case "Arrays": {
					let t = n.elements.filter(sg);
					if (t.length > 0) return `${c_(n.isMutable)}[ ${t.map((t) => e(t) + l_(t.context?.isOptional)).join(", ")}, ... ]`;
					break;
				}
				case "Objects": {
					let t = n.propertySignatures.filter((e) => sg(e.type));
					if (t.length > 0) return `{ ${t.map((t) => `${c_(t.type.context?.isMutable)}${Pa(t.name)}${l_(t.type.context?.isOptional)}: ${e(t.type)}`).join(", ")}, ... }`;
					break;
				}
			}
			return e(n);
		});
		return Array.from(new Set(n)).join(" | ");
	}
};
function n_(e, t, n, r) {
	let i = Hh(t);
	return i ? $f(new Dh(e, [i], n, r)) : Qf(t);
}
function r_(e, t, n, r) {
	return pm(t, (t) => n_(e, t, n, r));
}
function i_(e, t, n, r, i) {
	let a = {
		ast: e,
		parser: t,
		input: r,
		out: void 0,
		successes: e.options?.mode === "oneOf" ? [] : void 0,
		issues: void 0,
		options: i
	}, o = o_(a, n);
	return o ? a_(o, a) : a.out ? a.out : em(new Dh(e, a.issues ?? [], r, i));
}
function a_(e, t) {
	return Rm(e, (e) => t.out === $ ? Y(t.input) : t.out ? t.out : em(new Dh(t.ast, t.issues ?? [], t.input, t.options)));
}
var o_ = /*#__PURE__*/ sf()({
	onItem(e, t) {
		return e.parser(t)(e.input, e.options);
	},
	step(e, t, n) {
		if (n._tag === "Failure") {
			let t = Hh(n.cause);
			if (t === void 0) return n;
			e.issues ? e.issues.push(t) : e.issues = [t];
		} else {
			if (e.out && e.successes) return e.successes.push(e.ast.types[t]), $f(new Oh(e.ast, e.successes, e.input, e.options));
			if (e.out = n, e.successes) e.successes.push(e.ast.types[t]);
			else return ep;
		}
	}
}), s_ = /*#__PURE__*/ new t_([
	/*#__PURE__*/ new yg("Infinity"),
	/*#__PURE__*/ new yg("-Infinity"),
	/*#__PURE__*/ new yg("NaN")
]);
function c_(e) {
	return e ? "" : "readonly ";
}
function l_(e) {
	return e ? "?" : "";
}
var u_ = class extends Ci {
	_tag = "Filter";
	run;
	annotations;
	aborted;
	constructor(e, t = void 0, n = !1) {
		super(), this.run = e, this.annotations = t, this.aborted = n;
	}
	annotate(e) {
		return new u_(this.run, {
			...this.annotations,
			...e
		}, this.aborted);
	}
	abort() {
		return new u_(this.run, this.annotations, !0);
	}
	and(e, t) {
		return new d_([this, e], t);
	}
}, d_ = class extends Ci {
	_tag = "FilterGroup";
	checks;
	annotations;
	constructor(e, t = void 0) {
		super(), this.checks = e, this.annotations = t;
	}
	annotate(e) {
		return new d_(this.checks, {
			...this.annotations,
			...e
		});
	}
	and(e, t) {
		return new d_([this, e], t);
	}
};
function f_(e, t, n = !1) {
	return new u_((t, n, r) => jh(n, e(t, n, r), t, r), t, n);
}
function p_(e) {
	return f_((e) => globalThis.Number.isFinite(e), {
		expected: "a finite number",
		representation: {
			id: "effect/schema/isFinite",
			payload: null
		},
		toJsonSchema: () => ({ type: "number" }),
		toCode: () => ({ runtime: "Schema.isFinite()" }),
		arbitraryConstraint: { number: "finite" },
		...e
	});
}
var m_ = /*#__PURE__*/ T_(wg, [/*#__PURE__*/ p_()]), h_ = /*#__PURE__*/ new fg(/*#__PURE__*/ new t_([m_, s_]), /*#__PURE__*/ new Qh(/*#__PURE__*/ Yh(), /*#__PURE__*/ qh((e) => globalThis.Number.isFinite(e) ? e : globalThis.String(e))));
function g_(e, t) {
	let n = new globalThis.RegExp(e), r = {
		source: n.source,
		flags: n.flags
	};
	return f_((e) => (n.lastIndex = 0, n.test(e)), {
		expected: `a string matching the RegExp ${r.source}`,
		representation: {
			id: "effect/schema/isPattern",
			payload: r
		},
		toJsonSchema: () => [{}, !0],
		arbitraryConstraint: { patterns: [r] },
		...t
	});
}
var __ = /*#__PURE__*/ new WeakMap();
function v_(e, t) {
	let n = Object.assign(Object.create(Object.getPrototypeOf(e)), e, t);
	return Reflect.ownKeys(t).every((e) => e === "context" || e === "encoding") && __.set(n, y_(e)), n;
}
function y_(e) {
	let t = __.get(e);
	if (t !== void 0) return t;
	if (e.encoding === void 0) return e;
	let n = Object.assign(Object.create(Object.getPrototypeOf(e)), e, { encoding: void 0 });
	return __.set(e, n), n;
}
function b_(e, t) {
	return e.encoding === t ? e : v_(e, { encoding: t });
}
function x_(e, t) {
	if (e.context === t) return e;
	let n = y_(e);
	return n.context === t && n.encoding === e.encoding ? n : v_(e, { context: t });
}
function S_(e) {
	return e.encoding ? S_(e.encoding[e.encoding.length - 1].to) : e;
}
function C_(e, t) {
	if (e.checks) {
		let n = e.checks[e.checks.length - 1];
		return w_(e, dc(e.checks.slice(0, -1), n.annotate(t)));
	}
	return v_(e, { annotations: {
		...e.annotations,
		...t
	} });
}
function w_(e, t) {
	if (e._tag === "Suspend" && t) throw Error("Cannot add checks to Suspend");
	return e.checks === t ? e : v_(e, { checks: t });
}
function T_(e, t) {
	return w_(e, Ug(e.checks, t));
}
function E_(e, t) {
	let n = t(e.to);
	return n === e.to ? e : new fg(n, e.transformation);
}
function D_(e, t) {
	let n = e, r = n[n.length - 1], i = E_(r, t);
	return i === r ? e : dc(e.slice(0, e.length - 1), i);
}
function O_(e) {
	return (t) => t.encoding ? b_(t, D_(t.encoding, e)) : t;
}
function k_(e, t) {
	function n(r) {
		if (r.encoding) {
			let e = r.encoding[r.encoding.length - 1];
			return t?.stopAt?.(e) ? r : b_(r, D_(r.encoding, n));
		}
		return e(r);
	}
	return Ai(n);
}
function A_(e, t, n) {
	let r = new fg(e, t);
	return b_(n, n.encoding ? [...n.encoding, r] : [r]);
}
function j_(e, t) {
	let n;
	for (let r = 0; r < e.length; r++) {
		let i = e[r], a = t(i);
		if (n) n[r] = a;
		else if (a !== i) {
			n = Array(e.length);
			for (let t = 0; t < r; t++) n[t] = e[t];
			n[r] = a;
		}
	}
	return n ?? e;
}
function M_(e, t) {
	return x_(e, e.context ? new mg(e.context.isOptional, e.context.isMutable, e.context.constructorDefault, {
		...e.context.annotations,
		...t
	}) : new mg(!1, !1, void 0, t));
}
var N_ = /*#__PURE__*/ Ai((e) => P_(x_(e, e.context ? e.context.isOptional === !1 ? new mg(!0, e.context.isMutable, e.context.constructorDefault, e.context.annotations) : e.context : new mg(!0, !1)))), P_ = /*#__PURE__*/ O_(N_);
function F_(e, t, n) {
	return A_(e, n, t);
}
function I_(e) {
	let t = [], n = [];
	function r(e) {
		switch (e._tag) {
			case "Literal":
				zi(e.literal) && !t.includes(e.literal) && t.push(e.literal);
				return;
			case "UniqueSymbol":
				t.includes(e.symbol) || t.push(e.symbol);
				return;
			case "Never": return;
			case "Union":
				for (let t = 0; t < e.types.length; t++) r(e.types[t]);
				return;
			default: n.push(e);
		}
	}
	return r(e), {
		literals: t,
		parameters: n
	};
}
function L_(e, t) {
	let { literals: n, parameters: r } = I_(e);
	return new Rg(n.map((e) => new Ng(e, t)), r.map((e) => new Lg(e, t)));
}
function R_(e) {
	return e.context?.isOptional ?? !1;
}
function z_(e) {
	return e.annotations?.["~structural"] === !0 || e._tag === "FilterGroup" && e.checks.every(z_);
}
function B_(e) {
	function t(e) {
		return z_(e) ? [e] : e._tag === "FilterGroup" ? e.checks.flatMap(t) : [];
	}
	let n = e.flatMap(t);
	return fc(n) ? n : void 0;
}
function V_(e) {
	let t = !0;
	function n(e) {
		return t = t && !e.encoding && !dg(e), t && "recur" in e && e.recur(n), e;
	}
	return "recur" in e && e.recur(n), t;
}
var H_ = /*#__PURE__*/ Ai((e) => {
	let t = y_(e);
	if (t !== e) {
		let n = H_(t);
		return n === t && e.encoding === void 0 ? e : x_(n, e.context);
	}
	let n = "recur" in e ? e.recur(H_) : e;
	if ("encodingChecks" in n && n.encodingChecks) {
		let t = V_(e) ? n.encodingChecks : lg(n) || ug(n) || ag(n) && n.typeParameters.length > 0 ? B_(n.encodingChecks) : void 0;
		return v_(n, {
			encodingChecks: void 0,
			checks: Ug(n.checks, t)
		});
	}
	return n;
}), U_ = /*#__PURE__*/ Ai((e) => H_(G_(e)));
function W_(e, t) {
	let n = t, r = n.length, i = n[r - 1], a = [new fg(G_(b_(e, void 0)), n[0].transformation.flip())];
	for (let e = 1; e < r; e++) a.unshift(new fg(G_(n[e - 1].to), n[e].transformation.flip()));
	let o = G_(i.to);
	return o.encoding ? b_(o, [...o.encoding, ...a]) : b_(o, a);
}
var G_ = /*#__PURE__*/ ki((e) => {
	if (e.encoding) return W_(e, e.encoding);
	let t = y_(e);
	if (t !== e) {
		let n = G_(t);
		return n === t ? e : x_(n, e.context);
	}
	return "flip" in e ? e.flip(G_) : "recur" in e ? e.recur(G_) : e;
});
function K_(e) {
	switch (e._tag) {
		case "Undefined": return !0;
		case "Union": return e.types.some(K_);
		default: return !1;
	}
}
function q_(e, t) {
	let n = t === 0 ? $ : dh(t);
	return (r, i) => r === Q ? fh : r === t ? n : em(new Th(e, r, i));
}
function J_(e, t) {
	return (n, r) => n === Q ? fh : t(n) ? $ : em(new Th(e, n, r));
}
var Y_ = /*#__PURE__*/ k_((e) => {
	switch (e._tag) {
		default: return e;
		case "Number": return e.toCodecStringTree();
		case "Union": return e.recur(Y_);
	}
}), X_ = /*#__PURE__*/ new globalThis.RegExp(`^${jg}$`), Z_ = /*#__PURE__*/ new globalThis.RegExp(`^(?:${jg}|Infinity|-Infinity|NaN)$`);
function Q_(e) {
	return g_(X_, {
		expected: "a string representing a finite number",
		representation: {
			id: "effect/schema/isStringFinite",
			payload: null
		},
		toJsonSchema: () => ({ pattern: X_.source }),
		...e
	});
}
var $_ = /*#__PURE__*/ T_(xg, [/*#__PURE__*/ Q_()]), ev = /*#__PURE__*/ new fg($_, rg), tv = /*#__PURE__*/ new fg(/*#__PURE__*/ new t_([$_, s_]), rg);
function nv(e, t, n, r, i) {
	for (let a = 0; a < e.length; a++) {
		let o = e[a];
		if (o._tag === "FilterGroup") {
			if (n = nv(o.checks, t, n, r, i), n && (i.errors !== "all" || n[n.length - 1].filter.aborted)) return n;
		} else {
			let e = o.run(t, r, i);
			if (e) {
				let r = new yh(o, e, t, i);
				if (n ? n.push(r) : n = [r], i.errors !== "all" || o.aborted) return n;
			}
		}
	}
	return n;
}
function rv(e) {
	if (!ag(e)) return;
	let t = e.annotations?.[lh];
	return Bi(t) ? t(e.typeParameters) : void 0;
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/internal/schema/interpreter.js
var iv = (e, t, n) => e === $ ? n(t) : Rm(e, n);
function av(e) {
	if (e._tag === "Middleware") return (t, n, r) => ov(t === $ ? e.decode(dh(ph(n)), r) : e.decode(Lm(t, ph), r));
	let t = e.decode;
	switch (t._tag) {
		case "Passthrough": return (e, t) => e === $ ? dh(t) : e;
		case "Transform": {
			let e = (e) => e === Q ? fh : dh(t.transform(e));
			return (t, n) => iv(t, n, e);
		}
		case "TransformOptional": {
			let e = (e) => mh(t.transform(ph(e)));
			return (t, n) => iv(t, n, e);
		}
		case "TransformEffect": return (e, n, r) => iv(e, n, (e) => e === Q ? fh : t.transform(e, r));
		case "TransformOptionalEffect": return (e, n, r) => iv(e, n, (e) => ov(t.transform(ph(e), r)));
	}
}
var ov = (e) => Rm(e, mh), sv = (e, t, n, r) => pm(r, (r) => nm(() => Jf(r, (r) => new bh(e, r, t, n))));
function cv(e, t) {
	let n = av(e.link.transformation), r;
	return (i, a) => {
		if (i === Q) return fh;
		if (e.isConstructed(i)) return $;
		let o = (r ??= t(e.link.to))(i, a);
		return n(o, i, a);
	};
}
function lv(e, t) {
	let n = e.context.constructorDefault;
	return (r, i) => {
		if (r !== Q && r !== void 0) return t(r, i);
		let a = n;
		if (J(a) && a._tag === "Success") {
			let e = t(a[z], i);
			return e === $ ? a : e;
		}
		return Rm(sv(e, r, i, a), (e) => {
			let n = t(e, i);
			return n === $ ? dh(e) : n;
		});
	};
}
function uv(e, t) {
	let n = t(e);
	return e.context?.constructorDefault === void 0 ? n : lv(e, n);
}
function dv(e, t, n, r, i) {
	if (e._tag === "Declaration") for (let n of e.typeParameters) t(n);
	let a = n ? rv(e) : void 0, o = a ? cv(a, t) : r ?? e.getParser(t, n), s = e.checks, c = e.encoding, l = c?.map((e) => av(e.transformation)), u = e.encodingChecks;
	if (!c && !s && !u) return o;
	let d, f = (t, n) => {
		let r = o(t, n);
		if (u && !n.disableChecks) {
			if (J(r)) {
				if (r._tag === "Success") {
					let i = r === $ ? t : r[z];
					if (t !== Q && i !== Q) {
						let i = nv(u, t, void 0, e, n);
						i && (r = em(new wh(e, i, t, n)));
					}
				}
			} else r = Z(r, (r) => {
				if (t !== Q && r !== Q) {
					let r = nv(u, t, void 0, e, n);
					if (r) return em(new wh(e, r, t, n));
				}
				return Y(r);
			});
		}
		if (s && !n.disableChecks) {
			if (J(r)) {
				if (r._tag === "Success") {
					let i = r === $ ? t : r[z];
					if (i === Q) return r;
					let a = nv(s, i, void 0, e, n);
					a && (r = em(new wh(e, a, i, n)));
				}
			} else r = Z(r, (t) => {
				if (t !== Q) {
					let r = nv(s, t, void 0, e, n);
					if (r) return em(new wh(e, r, t, n));
				}
				return Y(t);
			});
		}
		return r;
	}, p = i === void 0 ? f : i(f);
	return c ? (n, r) => {
		let i = d ??= c.map((e) => t(e.to)), a = n, o = i[i.length - 1](n, r);
		for (let e = c.length - 1; e >= 0; e--) if (o = l[e](o, a, r), e !== 0) {
			let t = i[e - 1];
			o._tag === "Success" ? (a = o[z], o = t(a, r)) : o = Rm(o, (e) => {
				let n = t(e, r);
				return n === $ ? dh(e) : n;
			});
		}
		if (o._tag === "Success") {
			let e = o[z], t = p(e, r);
			return t === $ ? o : t;
		}
		return o = sv(e, n, r, o), Rm(o, (e) => {
			let t = p(e, r);
			return t === $ ? dh(e) : t;
		});
	} : p;
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/internal/schema/compilerRegistry.js
var fv = /*#__PURE__*/ Symbol(), pv = /*#__PURE__*/ new WeakMap(), mv = (e) => vv(e).parser, hv = (e) => vv(e).makeEffect, gv = (e) => uv(e, hv), _v = class {
	ast;
	constructor(e) {
		this.ast = e;
	}
	get decodeEffect() {
		return this.cachedDecodeEffect ??= dv(this.ast, mv);
	}
	get parser() {
		return this.decodeEffect;
	}
	get makeEffect() {
		return this.cachedMakeEffect ??= dv(this.ast, hv, gv);
	}
};
function vv(e) {
	let t = pv.get(e);
	if (t !== void 0) return t;
	let n = new _v(e);
	return pv.set(e, n), n;
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/SchemaParser.js
function yv(e) {
	let t = e.ast, n;
	return (e, r) => (n ??= Dv(jv, H_(t)))(e, r?.disableChecks ? r?.parseOptions ? {
		...r.parseOptions,
		disableChecks: !0
	} : { disableChecks: !0 } : r?.parseOptions);
}
function bv(e) {
	let t = yv(e);
	return (e, n) => {
		let r = Pm(t(e, n));
		return tp(r) ? _s(r.value) : (Uh(r.cause, "Option adapter can only return none for schema issues"), gs());
	};
}
function xv(e) {
	return kv(H_(e.ast));
}
function Sv(e, t) {
	let n = Tv(e.ast);
	return t === void 0 ? n : (e, r) => n(e, Cv(t, r));
}
var Cv = (e, t) => t ? {
	...e,
	...t
} : e, wv = (e) => e === Q ? em(new Eh()) : Y(e);
function Tv(e) {
	return Dv(Av, e);
}
function Ev(e, t) {
	return e === $ ? Y(t) : J(e) ? e[z] === Q ? wv(Q) : e : Rm(e, wv);
}
function Dv(e, t) {
	let n;
	return (r, i) => {
		let a = (n ??= e(t))(r, i ?? pg);
		return a === $ ? Y(r) : J(a) ? a[z] === Q ? wv(Q) : a : Rm(a, wv);
	};
}
function Ov(e, t) {
	let n = Pm(e);
	if (tp(n)) return n.value;
	let r = Uh(n.cause, t);
	throw Error("Schema validation failed", { cause: r });
}
function kv(e) {
	let t, n;
	return (r, i) => {
		t ??= vv(e);
		let a = i?.disableChecks ? i.parseOptions ? {
			...i.parseOptions,
			disableChecks: !0
		} : { disableChecks: !0 } : i?.parseOptions ?? pg, o = t.make;
		if (o !== void 0 && r !== Q) {
			let e;
			try {
				e = o(r, a);
			} catch (e) {
				throw Uh(qf(e), "Constructor adapter can only throw schema issues"), e;
			}
			if (e !== fv && e !== Q) return e;
		}
		return Ov(Ev((n ??= t.makeEffect)(r, a), r), "Constructor adapter can only throw schema issues");
	};
}
var Av = (e) => vv(e).parser, jv = (e) => vv(e).makeEffect, Mv = "~effect/Schema/Schema", Nv = /*#__PURE__*/ Symbol(), Pv = {
	[Mv]: Mv,
	get make() {
		let e = xv(this);
		return Object.defineProperty(this, "make", {
			value: e,
			enumerable: !0
		}), e;
	},
	get makeEffect() {
		let e = yv(this);
		return Object.defineProperty(this, "makeEffect", {
			value: e,
			enumerable: !0
		}), e;
	},
	get makeOption() {
		let e = bv(this);
		return Object.defineProperty(this, "makeOption", {
			value: e,
			enumerable: !0
		}), e;
	},
	pipe() {
		return xi(this, arguments);
	},
	annotate(e) {
		return this.rebuild(C_(this.ast, e));
	},
	annotateKey(e) {
		return this.rebuild(M_(this.ast, e));
	},
	check(...e) {
		return this.rebuild(T_(this.ast, e));
	},
	rebuild(e) {
		return Fv(e, this[Nv]);
	}
};
function Fv(e, t) {
	function n() {}
	let r = Object.setPrototypeOf(n, Pv);
	return t && (Object.hasOwn(t, "name") || Object.hasOwn(t, "length") || Object.hasOwn(t, "__proto__")) ? Object.defineProperties(r, Object.getOwnPropertyDescriptors({ ...t })) : Object.assign(r, t), r[Nv] = t, r.ast = e, r;
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/Struct.js
var Iv = (e) => e, Lv = "~effect/Schema/SchemaError", Rv = class extends (/*#__PURE__*/ sl("SchemaError")) {
	[Lv] = Lv;
	constructor(e) {
		let t = Ua();
		Wa(0);
		try {
			super({ issue: e });
		} finally {
			Wa(t);
		}
	}
	get message() {
		return zh(this.issue);
	}
	toString() {
		return `SchemaError(${this.message})`;
	}
};
function zv(e) {
	return J(e) ? Bv(e) : pm(e, (e) => nm(() => Jf(e, (e) => new Rv(e))));
}
function Bv(e) {
	return tp(e) ? e : Qf(Jf(e.cause, (e) => new Rv(e)));
}
function Vv(e, t) {
	let n = Sv(e, t);
	return (e, t) => zv(n(e, t));
}
var Hv = Fv, Uv = /*#__PURE__*/ Iv((e) => Hv(N_(e.ast), { schema: e }));
function Wv(e) {
	let t = Hv(new yg(e), {
		literal: e,
		transform(n) {
			return t.pipe($v(Wv(n), {
				decode: qh(() => n),
				encode: qh(() => e)
			}));
		}
	});
	return t;
}
var Gv = /*#__PURE__*/ Hv(xg);
function Kv(e, t) {
	return Hv(e, {
		fields: t,
		mapFields(e, t) {
			let n = e(this.fields);
			return Kv(Wg(n, t?.unsafePreserveChecks ? this.ast.checks : void 0), n);
		}
	});
}
function qv(e) {
	return Kv(Wg(e, void 0), e);
}
function Jv(e, t) {
	return Hv(L_(e.ast, t.ast), {
		key: e,
		value: t
	});
}
var Yv = /*#__PURE__*/ Iv((e) => Hv(new Tg(!1, [], [e.ast]), { value: e }));
function Xv(e, t) {
	return Hv(e, {
		members: t,
		mapMembers(e, t) {
			let n = e(this.members);
			return Xv(Kg(n, this.ast.options, t?.unsafePreserveChecks ? this.ast.checks : void 0), n);
		}
	});
}
function Zv(e, t) {
	return Xv(Kg(e, t, void 0), e);
}
function Qv(e) {
	let t = e.map(Wv);
	return Hv(Kg(t, void 0, void 0), {
		literals: e,
		members: t,
		mapMembers(e) {
			return Zv(e(this.members));
		},
		pick(e) {
			return Qv(e);
		},
		transform(e) {
			return Zv(t.map((t, n) => t.transform(e[n])));
		}
	});
}
function $v(e, t) {
	return (n) => Hv(F_(n.ast, e.ast, t ? eg(t) : ng()), {
		from: n,
		to: e
	});
}
var ey = /*#__PURE__*/ Hv(m_);
globalThis.RegExp, globalThis.URL, globalThis.File, globalThis.FormData, globalThis.URLSearchParams, globalThis.Uint8Array;
var ty = Ql, ny = hf, ry = Cf, iy = "~effect/MutableRef", ay = {
	[iy]: iy,
	...ro,
	toJSON() {
		return {
			_id: "MutableRef",
			current: Ba(this.current)
		};
	}
}, oy = (e) => {
	let t = Object.create(ay);
	return t.current = e, t;
}, sy = /*#__PURE__*/ F(2, (e, t) => (e.current = t, e)), cy = /*#__PURE__*/ Symbol.for("effect/MutableList/Empty"), ly = () => ({
	head: void 0,
	tail: void 0,
	length: 0
}), uy = (e) => {
	let t = e.head;
	t.offset >= 1024 && t === e.tail && t.mutable && (t.array.length - t.offset) * 8 <= t.offset && (e.head = e.tail = {
		array: t.array.slice(t.offset),
		mutable: !0,
		offset: 0,
		next: void 0
	});
}, dy = () => ({
	array: [],
	mutable: !0,
	offset: 0,
	next: void 0
}), fy = (e, t) => {
	e.tail ? e.tail.mutable || (e.tail.next = dy(), e.tail = e.tail.next) : e.head = e.tail = dy(), e.tail.array.push(t), e.length++;
}, py = (e, t) => {
	e.head = {
		array: [t],
		mutable: !0,
		offset: 0,
		next: e.head
	}, e.tail ||= e.head, e.length++;
}, my = (e) => {
	e.head = e.tail = void 0, e.length = 0;
}, hy = (e, t) => {
	if (t = nc(t), t <= 0 || !e.head) return [];
	if (t = Math.min(t, e.length), t === e.length && e.head?.offset === 0 && !e.head.next) {
		let t = e.head.array;
		return my(e), t;
	}
	let n = Array(t), r = 0, i = e.head;
	for (; i;) {
		for (; i.offset < i.array.length;) if (n[r++] = i.array[i.offset], i.mutable && (i.array[i.offset] = void 0), i.offset++, r === t) return e.head = i.offset === i.array.length && i.next ? i.next : i, e.length -= t, e.length === 0 ? my(e) : uy(e), n;
		i = i.next;
	}
	return my(e), n;
}, gy = (e) => hy(e, e.length), _y = (e) => {
	if (!e.head) return cy;
	let t = e.head.array[e.head.offset];
	return e.head.mutable && (e.head.array[e.head.offset] = void 0), e.head.offset++, e.length--, e.head.offset === e.head.array.length ? e.head.next ? e.head = e.head.next : my(e) : uy(e), t;
}, vy = (e, t) => {
	let n = [], r = e.head, i = 0;
	for (; r;) {
		for (let e = r.offset; e < r.array.length; e++) t(r.array[e], i++) && n.push(r.array[e]);
		r = r.next;
	}
	if (n.length === 0) {
		my(e);
		return;
	}
	e.head = e.tail = {
		array: n,
		mutable: !0,
		offset: 0,
		next: void 0
	}, e.length = n.length;
}, yy = (e, t) => vy(e, (e) => e !== t), by = "~effect/PubSub", xy = "~effect/PubSub/Subscription", Sy = (e) => X(() => Ry(e.atomicPubSub(), /* @__PURE__ */ new Map(), dp(), ry(!1), oy(!1), e.strategy(), oy(gs()))), Cy = (e) => Sy({
	atomicPubSub: () => wy(e),
	strategy: () => new zy()
}), wy = (e) => {
	let t = e?.replay;
	return new Py(t && t > 0 ? new Hy(Math.ceil(t)) : void 0);
}, Ty = /*#__PURE__*/ F(2, (e, t) => e.shutdownFlag.current || ys(e.ended.current) ? !1 : e.pubsub.publish(t) ? (e.strategy.completeSubscribersUnsafe(e.pubsub, e.subscribers), !0) : !1), Ey = (e) => Dm(bm((t) => {
	let n = Js(t, up), r = hp(e.scope), i = Ny(e.pubsub, e.subscribers, e.strategy, e.ended);
	return mp(r, Dy(i)).pipe(om(pp(n, (e) => gp(r, e))), um(i));
})), Dy = (e) => Dm(im((t) => (sy(e.shutdownFlag, !0), Jp(gy(e.pollers), (e) => cp(e, t.id), {
	discard: !0,
	concurrency: "unbounded"
}).pipe(sm(() => X(() => {
	e.subscribers.delete(e.subscription), e.subscription.unsubscribe(), e.replayWindow.close(), e.strategy.onPubSubEmptySpaceUnsafe(e.pubsub, e.subscribers);
})), _m(e.shutdownHook.open), dm)))), Oy = (e) => Xp(function t(n) {
	if (e.shutdownFlag.current) return Tm;
	let r = e.pollers.length === 0 ? e.subscription.pollUpTo(Infinity) : [];
	return n && (r = n.concat(r)), e.strategy.onPubSubEmptySpaceUnsafe(e.pubsub, e.subscribers), e.replayWindow.remaining > 0 ? Y(e.replayWindow.takeAll().concat(r)) : fc(r) ? Y(r) : Z(ky(e), (e) => t([e]));
}), ky = (e) => Qp((t) => {
	if (e.shutdownFlag.current) return t(Tm);
	if (ys(e.ended.current)) return t(Y(e.ended.current.value));
	let n = ip(), r = e.subscribers.get(e.subscription);
	return r || (r = /* @__PURE__ */ new Set(), e.subscribers.set(e.subscription, r)), r.add(e.pollers), fy(e.pollers, n), e.strategy.completePollersUnsafe(e.pubsub, e.subscribers, e.subscription, e.pollers), n.effect ? t(n.effect) : (n.resumes = [t], X(() => yy(e.pollers, n)));
}), Ay = /*#__PURE__*/ Symbol.for("effect/PubSub/AbsentValue"), jy = (e, t, n) => {
	e.has(t) || e.set(t, /* @__PURE__ */ new Set()), e.get(t).add(n);
}, My = (e, t, n) => {
	if (!e.has(t)) return;
	let r = e.get(t);
	r.delete(n), r.size === 0 && e.delete(t);
}, Ny = (e, t, n, r) => new Iy(e, t, e.subscribe(), ly(), ry(!1), oy(!1), n, e.replayWindow(), r), Py = class {
	publisherHead = {
		value: Ay,
		replayIndex: void 0,
		subscribers: 0,
		next: null
	};
	publisherTail = this.publisherHead;
	publisherIndex = 0;
	subscribersIndex = 0;
	capacity = 2 ** 53 - 1;
	replayBuffer;
	constructor(e) {
		this.replayBuffer = e;
	}
	replayWindow() {
		return this.replayBuffer ? new Uy(this.replayBuffer) : Wy;
	}
	isEmpty() {
		return this.publisherHead === this.publisherTail;
	}
	isFull() {
		return !1;
	}
	size() {
		return this.publisherIndex - this.subscribersIndex;
	}
	publish(e) {
		let t = this.replayBuffer?.offer(e), n = this.publisherTail.subscribers;
		if (n !== 0) {
			let r = {
				value: e,
				replayIndex: t,
				subscribers: n,
				next: null
			};
			this.publisherTail.next = r, this.publisherTail = this.publisherTail.next, this.publisherIndex += 1;
		}
		return !0;
	}
	publishAll(e) {
		if (this.publisherTail.subscribers !== 0) for (let t of e) this.publish(t);
		else this.replayBuffer && this.replayBuffer.offerAll(e);
		return [];
	}
	slide() {
		if (this.publisherHead !== this.publisherTail) {
			let e = this.publisherHead.next, t = e.value;
			this.publisherHead = this.publisherHead.next, this.publisherHead.value = Ay, this.subscribersIndex += 1, this.replayBuffer?.slide(t, e.replayIndex);
		}
	}
	subscribe() {
		return this.publisherTail.subscribers += 1, new Fy(this, this.publisherTail, this.publisherIndex, !1);
	}
}, Fy = class {
	self;
	subscriberHead;
	subscriberIndex;
	unsubscribed;
	constructor(e, t, n, r) {
		this.self = e, this.subscriberHead = t, this.subscriberIndex = n, this.unsubscribed = r;
	}
	isEmpty() {
		if (this.unsubscribed) return !0;
		let e = !0, t = !0;
		for (; t;) this.subscriberHead === this.self.publisherTail ? t = !1 : this.subscriberHead.next.value === Ay ? (this.subscriberHead = this.subscriberHead.next, this.subscriberIndex += 1) : (e = !1, t = !1);
		return e;
	}
	size() {
		return this.unsubscribed ? 0 : this.self.publisherIndex - Math.max(this.subscriberIndex, this.self.subscribersIndex);
	}
	poll() {
		if (this.unsubscribed) return cy;
		let e = !0, t = cy;
		for (; e;) if (this.subscriberHead === this.self.publisherTail) e = !1;
		else {
			let n = this.subscriberHead.next.value;
			n !== Ay && (t = n, --this.subscriberHead.subscribers, this.subscriberHead.subscribers === 0 && (this.self.publisherHead = this.self.publisherHead.next, this.self.publisherHead.value = Ay, this.self.subscribersIndex += 1), e = !1), this.subscriberHead = this.subscriberHead.next, this.subscriberIndex += 1;
		}
		return t;
	}
	pollUpTo(e) {
		e = nc(e);
		let t = [], n = 0;
		for (; n !== e;) {
			let r = this.poll();
			r === cy ? n = e : (t.push(r), n += 1);
		}
		return t;
	}
	unsubscribe() {
		if (!this.unsubscribed) for (this.unsubscribed = !0, --this.self.publisherTail.subscribers; this.subscriberHead !== this.self.publisherTail;) this.subscriberHead.next.value !== Ay && (--this.subscriberHead.subscribers, this.subscriberHead.subscribers === 0 && (this.self.publisherHead = this.self.publisherHead.next, this.self.publisherHead.value = Ay, this.self.subscribersIndex += 1)), this.subscriberHead = this.subscriberHead.next;
	}
}, Iy = class {
	[xy] = { _A: I };
	pubsub;
	subscribers;
	subscription;
	pollers;
	shutdownHook;
	shutdownFlag;
	strategy;
	replayWindow;
	ended;
	constructor(e, t, n, r, i, a, o, s, c) {
		this.pubsub = e, this.subscribers = t, this.subscription = n, this.pollers = r, this.shutdownHook = i, this.shutdownFlag = a, this.strategy = o, this.replayWindow = s, this.ended = c;
	}
	pipe() {
		return xi(this, arguments);
	}
}, Ly = class {
	[by] = { _A: I };
	pubsub;
	subscribers;
	scope;
	shutdownHook;
	shutdownFlag;
	strategy;
	ended;
	constructor(e, t, n, r, i, a, o) {
		this.pubsub = e, this.subscribers = t, this.scope = n, this.shutdownHook = r, this.shutdownFlag = i, this.strategy = a, this.ended = o;
	}
	pipe() {
		return xi(this, arguments);
	}
}, Ry = (e, t, n, r, i, a, o) => new Ly(e, t, n, r, i, a, o), zy = class {
	get shutdown() {
		return Zp;
	}
	handleSurplus(e, t, n, r) {
		return Y(!1);
	}
	onPubSubEmptySpaceUnsafe(e, t) {}
	completePollersUnsafe(e, t, n, r) {
		return By(this, e, t, n, r);
	}
	completeSubscribersUnsafe(e, t) {
		return Vy(this, e, t);
	}
}, By = (e, t, n, r, i) => {
	let a = !0;
	for (; a && !r.isEmpty();) {
		let o = _y(i);
		if (o === cy) My(n, r, i), i.length === 0 ? a = !1 : jy(n, r, i);
		else {
			let a = r.poll();
			a === cy ? py(i, o) : (lp(o, Zf(a)), e.onPubSubEmptySpaceUnsafe(t, n));
		}
	}
}, Vy = (e, t, n) => {
	for (let [r, i] of n) for (let a of i) e.completePollersUnsafe(t, n, r, a);
}, Hy = class {
	capacity;
	head = {
		value: Ay,
		index: 0,
		next: null
	};
	tail = this.head;
	slideValues = [];
	size = 0;
	index = 0;
	publisherIndex = 0;
	constructor(e) {
		this.capacity = e;
	}
	slide(e, t) {
		this.slideValues[this.index % this.capacity] = {
			value: e,
			index: t
		}, this.index++;
	}
	offer(e) {
		let t = this.publisherIndex++;
		return this.tail.value = e, this.tail.index = t, this.tail.next = {
			value: Ay,
			index: 0,
			next: null
		}, this.tail = this.tail.next, this.size === this.capacity ? this.head = this.head.next : this.size += 1, t;
	}
	offerAll(e) {
		for (let t of e) this.offer(t);
	}
}, Uy = class {
	buffer;
	values;
	index = 0;
	remaining;
	slideIndex;
	newestIndex = -1;
	constructor(e) {
		this.buffer = e, this.remaining = e.size, this.slideIndex = e.index, this.values = Array(this.remaining);
		let t = e.head;
		for (let e = 0; e < this.remaining; e++) this.values[e] = t.value, this.newestIndex = t.index, t = t.next;
	}
	close() {
		this.values.length = 0, this.remaining = 0;
	}
	sync() {
		let e = this.buffer.index - this.slideIndex;
		if (e === 0 || this.remaining === 0) return;
		let t = Math.min(e, this.buffer.capacity), n = this.buffer.index - t;
		for (let e = 0; e < t; e++) {
			let t = this.buffer.slideValues[(n + e) % this.buffer.capacity];
			t.index > this.newestIndex && (this.index = (this.index + 1) % this.values.length, this.values[(this.index + this.remaining - 1) % this.values.length] = t.value, this.newestIndex = t.index);
		}
		this.slideIndex = this.buffer.index;
	}
	take() {
		if (this.remaining === 0) return;
		this.sync();
		let e = this.values[this.index];
		return this.values[this.index] = Ay, this.index = (this.index + 1) % this.values.length, this.remaining--, this.remaining === 0 && this.close(), e;
	}
	takeN(e) {
		e = nc(e);
		let t = Math.min(e, this.remaining), n = Array(t);
		for (let e = 0; e < t; e++) n[e] = this.take();
		return n;
	}
	takeAll() {
		return this.takeN(this.remaining);
	}
}, Wy = {
	remaining: 0,
	take: () => void 0,
	takeN: () => [],
	takeAll: () => [],
	close: () => void 0
}, Gy = "~effect/Queue", Ky = "~effect/Queue/Enqueue", qy = "~effect/Queue/Dequeue", Jy = {
	_A: I,
	_E: I
}, Yy = {
	[Gy]: Jy,
	[Ky]: Jy,
	[qy]: Jy,
	...ro,
	toJSON() {
		return {
			_id: "effect/Queue",
			state: this.state._tag,
			size: cb(this)
		};
	}
}, Xy = (e) => H((t) => {
	let n = Object.create(Yy);
	return n.dispatcher = t.currentDispatcher, n.capacity = e?.capacity ?? Infinity, n.strategy = e?.strategy ?? "suspend", n.messages = ly(), n.scheduleRunning = !1, n.state = {
		_tag: "Open",
		takers: /* @__PURE__ */ new Set(),
		offers: /* @__PURE__ */ new Set(),
		awaiters: /* @__PURE__ */ new Set()
	}, W(n);
}), Zy = (e) => Xy({ capacity: e }), Qy = /*#__PURE__*/ F(2, (e, t) => K(() => $y(e, t) ? ub : e.state._tag === "Open" && e.strategy === "suspend" ? vb(e, t) : lb)), $y = (e, t) => e.state._tag === "Open" ? e.messages.length >= e.capacity ? e.strategy === "sliding" ? (_y(e.messages), fy(e.messages, t), !0) : e.capacity <= 0 && e.state.takers.size > 0 && (fy(e.messages, t), pb(e), !0) : (fy(e.messages, t), mb(e), !0) : !1, eb = /*#__PURE__*/ F(2, (e, t) => G(() => tb(e, t))), tb = (e, t) => {
	if (e.state._tag !== "Open") return !1;
	let n = Xu(Ao(t), db);
	return e.state.offers.size === 0 && e.messages.length === 0 ? (Cb(e, n), !0) : (e.state = {
		...e.state,
		_tag: "Closing",
		exit: n
	}, mb(e), !0);
}, nb = (e) => G(() => rb(e)), rb = (e) => {
	if (e.state._tag === "Done") return !1;
	my(e.messages);
	let t = e.state.offers;
	Cb(e, e.state._tag === "Open" ? fb : e.state.exit);
	for (let e of t) bb(e);
	return !0;
}, ib = (e) => ab(e, 1, Infinity), ab = /*#__PURE__*/ F(3, (e, t, n) => (t = nc(t), n = nc(n), K(() => hb(e, t, n) ?? Fu(_b(e, () => gb(e, t)), ab(e, t, n))))), ob = (e) => K(() => sb(e) ?? Fu(_b(e, () => gb(e, 1)), ob(e))), sb = (e) => {
	if (e.state._tag === "Done") return e.state.exit;
	if (e.messages.length > 0) {
		let t = _y(e.messages);
		return Sb(e), V(t);
	}
	if (e.capacity <= 0 && e.state.offers.size > 0) {
		let t = xb(e.state.offers);
		return Sb(e), V(t);
	}
}, cb = (e) => e.state._tag === "Done" ? 0 : e.messages.length, lb = /*#__PURE__*/ V(!1), ub = /*#__PURE__*/ V(!0), db = /*#__PURE__*/ jo(/*#__PURE__*/ zo()), fb = /*#__PURE__*/ Gu(), pb = (e) => {
	if (e.state._tag !== "Done" && e.state.takers.size !== 0) {
		for (let t of e.state.takers) if (t.ready() && (e.state.takers.delete(t), t.resume(Ju), e.messages.length === 0)) break;
	}
}, mb = (e) => {
	e.scheduleRunning || e.state._tag === "Done" || e.state.takers.size === 0 || (e.scheduleRunning = !0, e.dispatcher.scheduleTask(() => {
		e.scheduleRunning = !1, pb(e);
	}, 0));
}, hb = (e, t, n) => {
	if (e.state._tag === "Done") return e.state.exit;
	if (n <= 0 || t <= 0) return V([]);
	if (!gb(e, t)) return;
	let r = e.messages.length > 0 ? hy(e.messages, n) : [xb(e.state.offers)];
	return Sb(e), V(r);
}, gb = (e, t) => e.messages.length >= (e.state._tag === "Closing" ? 1 : Math.min(t, e.capacity || 1)) || e.capacity <= 0 && e.state._tag !== "Done" && e.state.offers.size > 0, _b = (e, t) => fu((n) => {
	if (e.state._tag === "Done") return n(e.state.exit);
	if (t()) return n(Ju);
	let r = {
		ready: t,
		resume: n
	};
	return e.state.takers.add(r), G(() => {
		e.state._tag !== "Done" && e.state.takers.delete(r);
	});
}), vb = (e, t) => fu((n) => $y(e, t) ? n(ub) : yb(e, {
	_tag: "Single",
	message: t,
	resume: n
})), yb = (e, t) => {
	if (e.state._tag !== "Open") return bb(t);
	let n = e.state.offers;
	return n.add(t), G(() => {
		e.state._tag !== "Done" && (n.delete(t), e.state._tag === "Closing" && n.size === 0 && e.messages.length === 0 && Cb(e, e.state.exit));
	});
}, bb = (e) => e._tag === "Single" ? e.resume(lb) : e.resume(V(e.remaining.slice(e.offset))), xb = (e) => {
	let t = e.values().next().value;
	if (t._tag === "Single") return e.delete(t), t.resume(ub), t.message;
	let n = t.remaining[t.offset++];
	return t.offset === t.remaining.length && (e.delete(t), t.resume(V([]))), n;
}, Sb = (e) => {
	if (e.state._tag === "Done") return Vp(e.state.exit.cause);
	if (e.state.offers.size === 0) return e.state._tag === "Closing" && e.messages.length === 0 && (Cb(e, e.state.exit), Vp(e.state.exit.cause));
	for (let t of e.state.offers) {
		let n = e.capacity - e.messages.length;
		if (n <= 0) break;
		if (t._tag === "Single") fy(e.messages, t.message), e.state.offers.delete(t), t.resume(ub);
		else {
			for (; t.offset < t.remaining.length; t.offset++) {
				if (n === 0) return !1;
				fy(e.messages, t.remaining[t.offset]), n--;
			}
			e.state.offers.delete(t), t.resume(V([]));
		}
	}
	return !1;
}, Cb = (e, t) => {
	if (e.state._tag === "Done") return;
	let n = e.state;
	e.state = {
		_tag: "Done",
		exit: t
	};
	for (let e of n.takers) e.resume(t);
	n.takers.clear();
	for (let e of n.awaiters) e(t);
	n.awaiters.clear();
}, wb = (e) => new Eb(e), Tb = (e, t, n) => fu((r) => {
	if (e.free >= t) return r(n);
	let i = () => {
		e.free < t || (e.waiters.delete(i), r(n));
	};
	return e.waiters.add(i), G(() => {
		e.waiters.delete(i);
	});
}), Eb = class {
	waiters = /*#__PURE__*/ new Set();
	taken = 0;
	permits;
	constructor(e) {
		this.permits = e;
	}
	get free() {
		return this.permits - this.taken;
	}
	take(e) {
		let t = K(() => this.free < e ? Tb(this, e, t) : (this.taken += e, W(e)));
		return t;
	}
	takeIfAvailable(e) {
		return K(() => this.free < e ? W(!1) : (this.taken += e, W(!0)));
	}
	releaseUnsafe(e, t) {
		return this.taken -= t, this.waiters.size > 0 && e.currentDispatcher.scheduleTask(() => {
			for (let e of this.waiters) {
				if (this.free <= 0) break;
				e();
			}
		}, 0), this.free;
	}
	resize(e) {
		return H((t) => (this.permits = e, this.free < 0 || this.releaseUnsafe(t, 0), q));
	}
	release(e) {
		return H((t) => W(this.releaseUnsafe(t, e)));
	}
	get releaseAll() {
		return H((e) => W(this.releaseUnsafe(e, this.taken)));
	}
	withPermits(e) {
		return (t) => tf((n) => {
			let r = K(() => this.free < e ? Bu(n(Tb(this, e, q)), () => r) : (this.taken += e, Bd(n(t), () => {
				this.releaseUnsafe(Ul(), e);
			}, !0)));
			return r;
		});
	}
	withPermit = /*#__PURE__*/ this.withPermits(1);
	withPermitsIfAvailable(e) {
		return (t) => tf((n) => this.free < e ? au : (this.taken += e, Bd(n(Pu(t)), () => {
			this.releaseUnsafe(Ul(), e);
		}, !0)));
	}
}, Db = "~effect/Channel", Ob = (e) => L(e, Db), kb = {
	[Db]: {
		_Env: I,
		_InErr: I,
		_InElem: I,
		_OutErr: I,
		_OutElem: I
	},
	pipe() {
		return xi(this, arguments);
	}
}, Ab = (e) => {
	let t = Object.create(kb);
	return t.transform = (t, n) => pm(e(t, n), (e) => Y(tm(e))), t;
}, jb = (e, t) => Ab((n, r) => Z(Pb(e)(n, r), (e) => t(e, r))), Mb = (e) => Ab((t, n) => e), Nb = (e) => Ab(Fm(function* (t, n) {
	let r = hp(n), i = (e) => gp(r, Gp(e));
	return Cm(yield* Cm(e(t, n, r), i), i);
})), Pb = (e) => e.transform, Fb = (e, t, n) => Xy({
	capacity: n?.bufferSize,
	strategy: n?.strategy
}).pipe(sm((t) => mp(e, nb(t))), sm((n) => km(fp(t(n), e), e))), Ib = (e, t) => Ab((n, r) => lm(Fb(r, e, t), ib)), Lb = (e) => Mb(Y(Em(Oy(e), () => Xf()))), Rb = (e) => Gb(lm(Ey(e), Lb)), zb = /*#__PURE__*/ F(2, (e, t) => jb(e, (e) => X(() => {
	let n = 0;
	return lm(e, (e) => t(e, n++));
}))), Bb = (e) => e === void 0 || e !== "unbounded" && e <= 1, Vb = /*#__PURE__*/ F((e) => Ob(e[0]), (e, t, n) => Bb(n?.concurrency) ? Hb(e, t) : Ub(e, t, n)), Hb = (e, t) => Ab((n, r) => {
	let i = 0;
	return lm(Pb(e)(n, r), Z((e) => t(e, i++)));
}), Ub = (e, t, n) => Nb(Fm(function* (r, i, a) {
	let o = 0, s = yield* Pb(e)(r, i), c = n.concurrency === "unbounded" ? 2 ** 53 - 1 : n.concurrency, l = yield* Zy(0);
	yield* mp(a, nb(l));
	let u = Mm(yield* ym()), d = ny(a);
	if (n.unordered) {
		let e = wb(c), n = wi(e.release(1)), r = vm({
			onFailure: (e) => Z(eb(l, e), n),
			onSuccess: (e) => Z(Qy(l, e), n)
		});
		yield* e.take(1).pipe(Z(() => s), Z((e) => {
			let n = o++;
			return d(u(r(Xp(() => t(e, n))))), Zp;
		}), Om({ disableYield: !0 }), pm((t) => e.withPermits(c - 1)(eb(l, t))), km(a));
	} else {
		let e = yield* Zy(c - 2);
		yield* mp(a, nb(e)), yield* ob(e).pipe(am, Z((e) => Qy(l, e)), Om({ disableYield: !0 }), pm((e) => eb(l, e)), km(a));
		let n, r = (e) => {
			e._tag !== "Success" && (n = e.cause, tb(l, e.cause));
		};
		yield* s.pipe(Z((i) => {
			if (n) return tm(n);
			let a = o++, s = u(Xp(() => t(i, a)));
			return d(s), s.addObserver(r), Qy(e, ty(s));
		}), Om({ disableYield: !0 }), pm((t) => Qy(e, Qf(t)).pipe(om(eb(e, t)))), km(a));
	}
	return ob(l);
})), Wb = (e) => jb(e, (e) => {
	let t, n = 0;
	return Y(Xp(function r() {
		if (t === void 0) return Z(e, (e) => {
			switch (e.length) {
				case 0: return r();
				case 1: return Y(e[0]);
				default: return t = e, Y(e[n++]);
			}
		});
		let i = t[n++];
		return n >= t.length && (t = void 0, n = 0), Y(i);
	}));
}), Gb = (e) => Ab((t, n) => {
	let r;
	return Y(Xp(() => r || e.pipe(fp(n), Z((e) => Pb(e)(t, n)), Z((e) => r = e))));
}), Kb = (e, t, n) => Xp(() => {
	let r = dp();
	return Bp(Z(Pb(e)(Xf(), r), t), n || Y).pipe(wm((e) => gp(r, e)));
}), qb = /*#__PURE__*/ F(2, (e, t) => Kb(e, (e) => Om(Z(e, t), { disableYield: !0 }))), Jb = (e, t) => Pb(e)(Xf(), t), Yb = "~effect/Stream", Xb = {
	_R: I,
	_E: I,
	_A: I
}, Zb = function(e) {
	this.channel = e;
};
Zb.prototype = {
	[Yb]: Xb,
	pipe() {
		return xi(this, arguments);
	}
};
var Qb = (e) => new Zb(e), $b = "~effect/Stream", ex = (e) => L(e, $b), tx = Qb, nx = (e, t) => tx(Ab((n, r) => Z(Jb(e.channel, r), (e) => t(e, r)))), rx = (e, t) => tx(Ib(e, t)), ix = (e) => tx(Rb(e)), ax = /*#__PURE__*/ F((e) => ex(e[0]), (e, t, n) => e.channel.pipe(Wb, Vb(t, n), zb(gc), tx)), ox = /*#__PURE__*/ F((e) => ex(e[0]), (e, t, n) => ax(e, (e) => um(t(e), e), n)), sx = /*#__PURE__*/ F(2, (e, t) => nx(e, Fm(function* (e, n) {
	let r = yield* Pp, i = Kc(Oc(t)), a, o, s = Infinity, c = ry(), l = ry(), u = ry();
	yield* e.pipe(c.whenOpen, Z((e) => (l.openUnsafe(), a = e, s = r.currentTimeMillisUnsafe() + i, Zp)), Om({ disableYield: !0 }), Cm((e) => (o = e, s = r.currentTimeMillisUnsafe(), l.openUnsafe(), u.openUnsafe(), Zp)), km(n));
	let d = Xp(function e() {
		let t = r.currentTimeMillisUnsafe();
		return Z(gm(hm(s < t ? i : Math.min(i, s - t)), u.await), () => {
			if (r.currentTimeMillisUnsafe() < s) return e();
			if (a) {
				l.closeUnsafe(), c.closeUnsafe();
				let e = Y(gc(mc(a)));
				return a = void 0, e;
			}
			return o ? tm(o) : e();
		});
	});
	return Xp(() => {
		if (o) {
			if (a) {
				let e = Y(gc(mc(a)));
				return a = void 0, e;
			}
			return tm(o);
		}
		return c.openUnsafe(), l.whenOpen(d);
	});
}))), cx = /*#__PURE__*/ F(2, (e, t) => qb(e.channel, (e) => {
	let n = 0;
	return Yp({
		while: () => n < e.length,
		body: () => t(e[n++]),
		step: Oi
	});
})), lx = Hf, ux = (e) => H((t) => e(t.getRef(lx))), dx = (...e) => ux((t) => G(() => {
	t.error(...e);
})), fx = {
	"~effect/Ref": { _A: I },
	...ro,
	toJSON() {
		return {
			_id: "Ref",
			ref: this.ref
		};
	}
}, px = (e) => {
	let t = Object.create(fx);
	return t.ref = oy(e), t;
}, mx = (e) => X(() => px(e)), hx = (e) => X(() => e.ref.current), gx = /*#__PURE__*/ F(2, (e, t) => X(() => sy(e.ref, t))), _x = "~effect/SubscriptionRef", vx = {
	...ro,
	[_x]: { _A: I },
	toJSON() {
		return {
			_id: "SubscriptionRef",
			value: this.value
		};
	}
}, yx = (e) => lm(Cy({ replay: 1 }), (t) => {
	let n = Object.create(vx);
	return n.semaphore = wb(1), n.value = e, n.pubsub = t, Ty(n.pubsub, e), n;
}), bx = (e) => ix(e.pubsub), xx = (e, t) => {
	e.value = t, Ty(e.pubsub, t);
}, Sx = /*#__PURE__*/ F(2, (e, t) => e.semaphore.withPermit(X(() => xx(e, t)))), Cx = {
	"-webkit-text-stroke": ["-webkit-text-stroke-color", "-webkit-text-stroke-width"],
	all: /* @__PURE__ */ "-webkit-border-horizontal-spacing.-webkit-border-image.-webkit-border-vertical-spacing.-webkit-box-align.-webkit-box-decoration-break.-webkit-box-direction.-webkit-box-flex.-webkit-box-ordinal-group.-webkit-box-orient.-webkit-box-pack.-webkit-box-reflect.-webkit-font-smoothing.-webkit-line-break.-webkit-line-clamp.-webkit-locale.-webkit-mask-box-image.-webkit-mask-box-image-outset.-webkit-mask-box-image-repeat.-webkit-mask-box-image-slice.-webkit-mask-box-image-source.-webkit-mask-box-image-width.-webkit-mask-position-x.-webkit-mask-position-y.-webkit-rtl-ordering.-webkit-ruby-position.-webkit-tap-highlight-color.-webkit-text-combine.-webkit-text-decorations-in-effect.-webkit-text-fill-color.-webkit-text-orientation.-webkit-text-security.-webkit-text-stroke-color.-webkit-text-stroke-width.-webkit-user-drag.-webkit-user-modify.-webkit-writing-mode.accent-color.align-content.align-items.align-self.alignment-baseline.anchor-name.anchor-scope.animation-composition.animation-delay.animation-direction.animation-duration.animation-fill-mode.animation-iteration-count.animation-name.animation-play-state.animation-range-end.animation-range-start.animation-timeline.animation-timing-function.animation-trigger.app-region.appearance.aspect-ratio.backdrop-filter.backface-visibility.background-attachment.background-blend-mode.background-clip.background-color.background-image.background-origin.background-position.background-repeat.background-size.baseline-shift.baseline-source.block-size.border-block-end-color.border-block-end-style.border-block-end-width.border-block-start-color.border-block-start-style.border-block-start-width.border-bottom-color.border-bottom-left-radius.border-bottom-right-radius.border-bottom-style.border-bottom-width.border-collapse.border-end-end-radius.border-end-start-radius.border-image-outset.border-image-repeat.border-image-slice.border-image-source.border-image-width.border-inline-end-color.border-inline-end-style.border-inline-end-width.border-inline-start-color.border-inline-start-style.border-inline-start-width.border-left-color.border-left-style.border-left-width.border-right-color.border-right-style.border-right-width.border-shape.border-start-end-radius.border-start-start-radius.border-top-color.border-top-left-radius.border-top-right-radius.border-top-style.border-top-width.bottom.box-decoration-break.box-shadow.box-sizing.break-after.break-before.break-inside.buffered-rendering.caption-side.caret-animation.caret-color.caret-shape.clear.clip.clip-path.clip-rule.color.color-interpolation.color-interpolation-filters.color-rendering.color-scheme.column-count.column-fill.column-gap.column-height.column-rule-break.column-rule-color.column-rule-inset-cap-end.column-rule-inset-cap-start.column-rule-inset-junction-end.column-rule-inset-junction-start.column-rule-style.column-rule-visibility-items.column-rule-width.column-span.column-width.column-wrap.contain.contain-intrinsic-block-size.contain-intrinsic-height.contain-intrinsic-inline-size.contain-intrinsic-size.contain-intrinsic-width.container-name.container-type.content.content-visibility.corner-bottom-left-shape.corner-bottom-right-shape.corner-end-end-shape.corner-end-start-shape.corner-start-end-shape.corner-start-start-shape.corner-top-left-shape.corner-top-right-shape.counter-increment.counter-reset.counter-set.cursor.cx.cy.d.display.dominant-baseline.dynamic-range-limit.empty-cells.field-sizing.fill.fill-opacity.fill-rule.filter.flex-basis.flex-direction.flex-grow.flex-line-count.flex-shrink.flex-wrap.float.flood-color.flood-opacity.font-family.font-feature-settings.font-kerning.font-language-override.font-optical-sizing.font-palette.font-size.font-size-adjust.font-stretch.font-style.font-synthesis-small-caps.font-synthesis-style.font-synthesis-weight.font-variant.font-variant-alternates.font-variant-caps.font-variant-east-asian.font-variant-emoji.font-variant-ligatures.font-variant-numeric.font-variant-position.font-variation-settings.font-weight.forced-color-adjust.frame-sizing.grid-auto-columns.grid-auto-flow.grid-auto-rows.grid-column-end.grid-column-start.grid-row-end.grid-row-start.grid-template-areas.grid-template-columns.grid-template-rows.height.hyphenate-character.hyphenate-limit-chars.hyphens.image-orientation.image-rendering.initial-letter.inline-size.inset-block-end.inset-block-start.inset-inline-end.inset-inline-start.interactivity.interest-delay-end.interest-delay-start.interpolate-size.isolation.justify-content.justify-items.justify-self.left.letter-spacing.lighting-color.line-break.line-height.list-style-image.list-style-position.list-style-type.margin-block-end.margin-block-start.margin-bottom.margin-inline-end.margin-inline-start.margin-left.margin-right.margin-top.marker-end.marker-mid.marker-start.mask-clip.mask-composite.mask-image.mask-mode.mask-origin.mask-position.mask-repeat.mask-size.mask-type.math-depth.math-shift.math-style.max-block-size.max-height.max-inline-size.max-width.min-block-size.min-height.min-inline-size.min-width.mix-blend-mode.object-fit.object-position.object-view-box.offset-anchor.offset-distance.offset-path.offset-position.offset-rotate.opacity.order.orphans.outline-color.outline-offset.outline-style.outline-width.overflow-anchor.overflow-block.overflow-clip-margin.overflow-inline.overflow-wrap.overflow-x.overflow-y.overlay.overscroll-behavior-block.overscroll-behavior-inline.overscroll-behavior-x.overscroll-behavior-y.padding-block-end.padding-block-start.padding-bottom.padding-inline-end.padding-inline-start.padding-left.padding-right.padding-top.paint-order.perspective.perspective-origin.pointer-events.position.position-anchor.position-area.position-try-fallbacks.position-try-order.position-visibility.print-color-adjust.quotes.r.reading-flow.reading-order.resize.right.rotate.row-gap.row-rule-break.row-rule-color.row-rule-inset-cap-end.row-rule-inset-cap-start.row-rule-inset-junction-end.row-rule-inset-junction-start.row-rule-style.row-rule-visibility-items.row-rule-width.ruby-align.ruby-overhang.ruby-position.rule-overlap.rx.ry.scale.scroll-axis-lock.scroll-behavior.scroll-initial-target.scroll-margin-block-end.scroll-margin-block-start.scroll-margin-bottom.scroll-margin-inline-end.scroll-margin-inline-start.scroll-margin-left.scroll-margin-right.scroll-margin-top.scroll-marker-group.scroll-padding-block-end.scroll-padding-block-start.scroll-padding-bottom.scroll-padding-inline-end.scroll-padding-inline-start.scroll-padding-left.scroll-padding-right.scroll-padding-top.scroll-snap-align.scroll-snap-stop.scroll-snap-type.scroll-target-group.scroll-timeline-axis.scroll-timeline-name.scrollbar-color.scrollbar-gutter.scrollbar-width.shape-image-threshold.shape-margin.shape-outside.shape-rendering.speak.stop-color.stop-opacity.stroke.stroke-dasharray.stroke-dashoffset.stroke-linecap.stroke-linejoin.stroke-miterlimit.stroke-opacity.stroke-width.tab-size.table-layout.text-align.text-align-last.text-anchor.text-autospace.text-box-edge.text-box-trim.text-combine-upright.text-decoration.text-decoration-color.text-decoration-line.text-decoration-skip-ink.text-decoration-style.text-decoration-thickness.text-emphasis-color.text-emphasis-position.text-emphasis-style.text-fit.text-indent.text-justify.text-orientation.text-overflow.text-rendering.text-shadow.text-size-adjust.text-spacing-trim.text-transform.text-underline-offset.text-underline-position.text-wrap-mode.text-wrap-style.timeline-scope.timeline-trigger-activation-range-end.timeline-trigger-activation-range-start.timeline-trigger-active-range-end.timeline-trigger-active-range-start.timeline-trigger-name.timeline-trigger-source.top.touch-action.transform.transform-box.transform-origin.transform-style.transition-behavior.transition-delay.transition-duration.transition-property.transition-timing-function.translate.trigger-scope.user-select.vector-effect.vertical-align.view-timeline-axis.view-timeline-inset.view-timeline-name.view-transition-class.view-transition-group.view-transition-name.view-transition-scope.visibility.white-space-collapse.widows.width.will-change.window-drag.word-break.word-spacing.writing-mode.x.y.z-index.zoom".split("."),
	animation: [
		"animation-delay",
		"animation-direction",
		"animation-duration",
		"animation-fill-mode",
		"animation-iteration-count",
		"animation-name",
		"animation-play-state",
		"animation-range-end",
		"animation-range-start",
		"animation-timeline",
		"animation-timing-function"
	],
	"animation-range": ["animation-range-end", "animation-range-start"],
	background: [
		"background-attachment",
		"background-clip",
		"background-color",
		"background-image",
		"background-origin",
		"background-position-x",
		"background-position-y",
		"background-repeat",
		"background-size"
	],
	"background-position": ["background-position-x", "background-position-y"],
	border: [
		"border-bottom-color",
		"border-bottom-style",
		"border-bottom-width",
		"border-image-outset",
		"border-image-repeat",
		"border-image-slice",
		"border-image-source",
		"border-image-width",
		"border-left-color",
		"border-left-style",
		"border-left-width",
		"border-right-color",
		"border-right-style",
		"border-right-width",
		"border-top-color",
		"border-top-style",
		"border-top-width"
	],
	"border-block": [
		"border-block-end-color",
		"border-block-end-style",
		"border-block-end-width",
		"border-block-start-color",
		"border-block-start-style",
		"border-block-start-width"
	],
	"border-block-start": [
		"border-block-start-color",
		"border-block-start-style",
		"border-block-start-width"
	],
	"border-block-color": ["border-block-end-color", "border-block-start-color"],
	"border-block-end": [
		"border-block-end-color",
		"border-block-end-style",
		"border-block-end-width"
	],
	"border-block-style": ["border-block-end-style", "border-block-start-style"],
	"border-block-width": ["border-block-end-width", "border-block-start-width"],
	"border-bottom": [
		"border-bottom-color",
		"border-bottom-style",
		"border-bottom-width"
	],
	"border-color": [
		"border-bottom-color",
		"border-left-color",
		"border-right-color",
		"border-top-color"
	],
	"border-image": [
		"border-image-outset",
		"border-image-repeat",
		"border-image-slice",
		"border-image-source",
		"border-image-width"
	],
	"border-inline": [
		"border-inline-end-color",
		"border-inline-end-style",
		"border-inline-end-width",
		"border-inline-start-color",
		"border-inline-start-style",
		"border-inline-start-width"
	],
	"border-inline-color": ["border-inline-end-color", "border-inline-start-color"],
	"border-inline-end": [
		"border-inline-end-color",
		"border-inline-end-style",
		"border-inline-end-width"
	],
	"border-inline-start": [
		"border-inline-start-color",
		"border-inline-start-style",
		"border-inline-start-width"
	],
	"border-inline-style": ["border-inline-end-style", "border-inline-start-style"],
	"border-inline-width": ["border-inline-end-width", "border-inline-start-width"],
	"border-left": [
		"border-left-color",
		"border-left-style",
		"border-left-width"
	],
	"border-radius": [
		"border-bottom-left-radius",
		"border-bottom-right-radius",
		"border-top-left-radius",
		"border-top-right-radius"
	],
	"border-right": [
		"border-right-color",
		"border-right-style",
		"border-right-width"
	],
	"border-spacing": ["-webkit-border-horizontal-spacing", "-webkit-border-vertical-spacing"],
	"border-style": [
		"border-bottom-style",
		"border-left-style",
		"border-right-style",
		"border-top-style"
	],
	"border-top": [
		"border-top-color",
		"border-top-style",
		"border-top-width"
	],
	"border-width": [
		"border-bottom-width",
		"border-left-width",
		"border-right-width",
		"border-top-width"
	],
	caret: [
		"caret-animation",
		"caret-color",
		"caret-shape"
	],
	"column-rule": [
		"column-rule-color",
		"column-rule-style",
		"column-rule-width"
	],
	columns: [
		"column-count",
		"column-height",
		"column-width",
		"column-wrap"
	],
	"contain-intrinsic-size": ["contain-intrinsic-height", "contain-intrinsic-width"],
	container: ["container-name", "container-type"],
	"corner-block-end-shape": ["corner-end-end-shape", "corner-end-start-shape"],
	"corner-block-start-shape": ["corner-start-end-shape", "corner-start-start-shape"],
	"corner-bottom-shape": ["corner-bottom-left-shape", "corner-bottom-right-shape"],
	"corner-inline-end-shape": ["corner-end-end-shape", "corner-start-end-shape"],
	"corner-inline-start-shape": ["corner-end-start-shape", "corner-start-start-shape"],
	"corner-left-shape": ["corner-bottom-left-shape", "corner-top-left-shape"],
	"corner-right-shape": ["corner-bottom-right-shape", "corner-top-right-shape"],
	"corner-shape": [
		"corner-bottom-left-shape",
		"corner-bottom-right-shape",
		"corner-top-left-shape",
		"corner-top-right-shape"
	],
	"corner-top-shape": ["corner-top-left-shape", "corner-top-right-shape"],
	flex: [
		"flex-basis",
		"flex-grow",
		"flex-shrink"
	],
	"flex-flow": ["flex-direction", "flex-wrap"],
	font: [
		"font-family",
		"font-feature-settings",
		"font-kerning",
		"font-language-override",
		"font-optical-sizing",
		"font-size",
		"font-size-adjust",
		"font-stretch",
		"font-style",
		"font-variant-alternates",
		"font-variant-caps",
		"font-variant-east-asian",
		"font-variant-emoji",
		"font-variant-ligatures",
		"font-variant-numeric",
		"font-variant-position",
		"font-variation-settings",
		"font-weight",
		"line-height"
	],
	"font-synthesis": [
		"font-synthesis-small-caps",
		"font-synthesis-style",
		"font-synthesis-weight"
	],
	"font-variant": [
		"font-variant-alternates",
		"font-variant-caps",
		"font-variant-east-asian",
		"font-variant-emoji",
		"font-variant-ligatures",
		"font-variant-numeric",
		"font-variant-position"
	],
	gap: ["column-gap", "row-gap"],
	grid: [
		"grid-auto-columns",
		"grid-auto-flow",
		"grid-auto-rows",
		"grid-template-areas",
		"grid-template-columns",
		"grid-template-rows"
	],
	"grid-template": [
		"grid-template-areas",
		"grid-template-columns",
		"grid-template-rows"
	],
	"grid-area": [
		"grid-column-end",
		"grid-column-start",
		"grid-row-end",
		"grid-row-start"
	],
	"grid-column": ["grid-column-end", "grid-column-start"],
	"grid-row": ["grid-row-end", "grid-row-start"],
	inset: [
		"bottom",
		"left",
		"right",
		"top"
	],
	"inset-block": ["inset-block-end", "inset-block-start"],
	"inset-inline": ["inset-inline-end", "inset-inline-start"],
	"interest-delay": ["interest-delay-end", "interest-delay-start"],
	"list-style": [
		"list-style-image",
		"list-style-position",
		"list-style-type"
	],
	margin: [
		"margin-bottom",
		"margin-left",
		"margin-right",
		"margin-top"
	],
	"margin-block": ["margin-block-end", "margin-block-start"],
	"margin-inline": ["margin-inline-end", "margin-inline-start"],
	marker: [
		"marker-end",
		"marker-mid",
		"marker-start"
	],
	mask: [
		"-webkit-mask-position-x",
		"-webkit-mask-position-y",
		"mask-clip",
		"mask-composite",
		"mask-image",
		"mask-mode",
		"mask-origin",
		"mask-repeat",
		"mask-size"
	],
	"mask-border": [
		"mask-border-mode",
		"mask-border-outset",
		"mask-border-repeat",
		"mask-border-slice",
		"mask-border-source",
		"mask-border-width"
	],
	"mask-position": ["-webkit-mask-position-x", "-webkit-mask-position-y"],
	offset: [
		"offset-anchor",
		"offset-distance",
		"offset-path",
		"offset-position",
		"offset-rotate"
	],
	outline: [
		"outline-color",
		"outline-style",
		"outline-width"
	],
	overflow: ["overflow-x", "overflow-y"],
	"overscroll-behavior": ["overscroll-behavior-x", "overscroll-behavior-y"],
	padding: [
		"padding-bottom",
		"padding-left",
		"padding-right",
		"padding-top"
	],
	"padding-block": ["padding-block-end", "padding-block-start"],
	"padding-inline": ["padding-inline-end", "padding-inline-start"],
	"place-content": ["align-content", "justify-content"],
	"place-items": ["align-items", "justify-items"],
	"place-self": ["align-self", "justify-self"],
	"position-try": ["position-try-fallbacks", "position-try-order"],
	"scroll-margin": [
		"scroll-margin-bottom",
		"scroll-margin-left",
		"scroll-margin-right",
		"scroll-margin-top"
	],
	"scroll-margin-block": ["scroll-margin-block-end", "scroll-margin-block-start"],
	"scroll-margin-inline": ["scroll-margin-inline-end", "scroll-margin-inline-start"],
	"scroll-padding": [
		"scroll-padding-bottom",
		"scroll-padding-left",
		"scroll-padding-right",
		"scroll-padding-top"
	],
	"scroll-padding-block": ["scroll-padding-block-end", "scroll-padding-block-start"],
	"scroll-padding-inline": ["scroll-padding-inline-end", "scroll-padding-inline-start"],
	"scroll-timeline": ["scroll-timeline-axis", "scroll-timeline-name"],
	"text-box": ["text-box-edge", "text-box-trim"],
	"text-decoration": [
		"text-decoration-color",
		"text-decoration-line",
		"text-decoration-style",
		"text-decoration-thickness"
	],
	"text-emphasis": ["text-emphasis-color", "text-emphasis-style"],
	"text-wrap": ["text-wrap-mode", "text-wrap-style"],
	"timeline-trigger": [
		"timeline-trigger-activation-range-end",
		"timeline-trigger-activation-range-start",
		"timeline-trigger-active-range-end",
		"timeline-trigger-active-range-start",
		"timeline-trigger-name",
		"timeline-trigger-source"
	],
	"timeline-trigger-range": ["timeline-trigger-range-end", "timeline-trigger-range-start"],
	"timeline-trigger-exit-range": ["timeline-trigger-exit-range-end", "timeline-trigger-exit-range-start"],
	transition: [
		"transition-behavior",
		"transition-delay",
		"transition-duration",
		"transition-property",
		"transition-timing-function"
	],
	"view-timeline": [
		"view-timeline-axis",
		"view-timeline-inset",
		"view-timeline-name"
	],
	"white-space": ["text-wrap-mode", "white-space-collapse"],
	"word-wrap": ["overflow-wrap"]
}, wx = /^@(media|supports|container|scope|starting-style)\b/i, Tx = (e, t) => {
	let n = 0;
	for (let r = t; r < e.length; r++) {
		let t = e[r];
		if (t === "\"" || t === "'") r = Ex(e, r);
		else if (t === "{" || t === "(" || t === "[") n++;
		else if ((t === "}" || t === ")" || t === "]") && --n === 0) return r + 1;
	}
	return e.length;
}, Ex = (e, t) => {
	for (let n = t + 1; n < e.length; n++) if (e[n] === "\\") n++;
	else if (e[n] === e[t]) return n;
	return e.length;
}, Dx = (e, t) => {
	let n = [], r = 0, i = 0;
	for (let a = 0; a < e.length; a++) {
		let o = e[a];
		o === "\"" || o === "'" ? a = Ex(e, a) : o === "(" || o === "[" || o === "{" ? r++ : o === ")" || o === "]" || o === "}" ? r-- : o === t && r === 0 && (n.push(e.slice(i, a)), i = a + 1);
	}
	return n.push(e.slice(i)), n.flatMap((e) => e.trim() ? [e.trim()] : []);
}, Ox = (e) => Dx(e, ";").flatMap((e) => {
	let t = e.indexOf(":");
	if (t <= 0) return [];
	let n = e.slice(0, t).trim(), r = e.slice(t + 1).trim(), i = /!\s*important$/i.test(r);
	return i && (r = r.replace(/\s*!\s*important$/i, "")), [{
		prop: n.startsWith("--") ? n : n.toLowerCase(),
		value: r,
		important: i
	}];
}), kx = (e, t, n, r) => {
	let i = 0;
	for (; i < e.length;) {
		for (; i < e.length && /\s/.test(e[i]);) i++;
		if (i >= e.length) return;
		let a = i;
		for (; a < e.length && e[a] !== "{" && e[a] !== ";";) {
			let t = e[a];
			a = t === "\"" || t === "'" ? Ex(e, a) + 1 : t === "(" || t === "[" ? Tx(e, a) : a + 1;
		}
		let o = e.slice(i, a).trim();
		if (a >= e.length || e[a] === ";") {
			i = a + 1;
			continue;
		}
		let s = Tx(e, a), c = e.slice(a + 1, s - 1);
		if (i = s, /^@layer\b/i.test(o)) {
			let e = o.slice(6).trim();
			kx(c, t ? `${t}.${e}` : e, n, r);
		} else if (wx.test(o)) kx(c, t, [...n, o], r);
		else if (/^@property\b/i.test(o)) {
			let e = Ox(c).find((e) => e.prop === "inherits");
			r.inherits.set(o.slice(9).trim(), e?.value.trim() !== "false");
		} else if (o.startsWith("@")) continue;
		else {
			let e = c.replace(/[^;{}]*\{[^]*\}/g, "");
			r.rules.push({
				index: r.rules.length,
				layer: t,
				wrap: n,
				selector: o,
				decls: Ox(e)
			});
		}
	}
}, Ax = Im("devtools.parseSheet")(function* (e) {
	return yield* X(() => {
		let t = {
			rules: [],
			inherits: /* @__PURE__ */ new Map()
		};
		return kx(e.replace(/\/\*[^]*?\*\//g, ""), "", [], t), t;
	});
}), jx = [
	0,
	0,
	0
], Mx = (e, t) => [
	e[0] + t[0],
	e[1] + t[1],
	e[2] + t[2]
], Nx = (e, t) => e[0] - t[0] || e[1] - t[1] || e[2] - t[2], Px = (e) => e.reduce((e, t) => Nx(t, e) > 0 ? t : e, jx), Fx = /^-?[\w-]+/, Ix = /^(is|not|has|matches)$/i, Lx = (e) => {
	let t = [
		0,
		0,
		0
	];
	for (let n = 0; n < e.length;) {
		let r = e[n], i = e.slice(n + 1);
		if (r === "#") t = Mx(t, [
			1,
			0,
			0
		]), n += 1 + (Fx.exec(i)?.[0].length ?? 0);
		else if (r === ".") t = Mx(t, [
			0,
			1,
			0
		]), n += 1 + (Fx.exec(i)?.[0].length ?? 0);
		else if (r === "[") t = Mx(t, [
			0,
			1,
			0
		]), n = Tx(e, n);
		else if (r === ":") {
			let r = e[n + 1] === ":", i = n + (r ? 2 : 1), a = Fx.exec(e.slice(i))?.[0] ?? "", o = i + a.length, s = e[o] === "(" ? e.slice(o + 1, Tx(e, o) - 1) : void 0;
			s !== void 0 && (o = Tx(e, o)), t = r ? Mx(t, [
				0,
				0,
				1
			]) : /^where$/i.test(a) ? Mx(t, jx) : Ix.test(a) && s !== void 0 ? Mx(t, Px(Dx(s, ",").map(Lx))) : Mx(t, [
				0,
				1,
				0
			]), n = o;
		} else /[a-zA-Z]/.test(r) ? (t = Mx(t, [
			0,
			0,
			1
		]), n += Fx.exec(e.slice(n))?.[0].length ?? 1) : n++;
	}
	return t;
}, Rx = /^(where|is|not|has|root|scope|host|first-child|last-child|only-child|first-of-type|last-of-type|only-of-type|empty|defined|nth-child|nth-last-child|nth-of-type|nth-last-of-type)$/i, zx = (e, t = !1) => {
	let n = "", r = [];
	for (let i = 0; i < e.length;) {
		let a = e[i];
		if (a === "[") {
			let n = Tx(e, i);
			r.push(`${t ? "within " : ""}${e.slice(i, n)}`), i = n;
		} else if (a === ":" && e[i + 1] !== ":") {
			let a = Fx.exec(e.slice(i + 1))?.[0] ?? "", o = i + 1 + a.length, s = e[o] === "(", c = s ? Tx(e, o) : o;
			if (Rx.test(a)) {
				if (s && /^(where|is|not|has)$/i.test(a)) {
					let i = Dx(e.slice(o + 1, c - 1), ",").map((e) => zx(e, t || /^where$/i.test(a)));
					i.forEach((e) => r.push(...e.states)), n += `:${a}(${i.map((e) => e.base || "*").join(", ")})`;
				} else n += e.slice(i, c);
			} else r.push(`${t ? "within " : ""}${e.slice(i, c)}`);
			i = c;
		} else n += a, i++;
	}
	return n = n.trim(), {
		base: /(^|[\s>+~])$/.test(n) ? `${n}*` : n,
		states: r
	};
}, Bx = class extends Ss()("@cssints/devtools/core/page") {}, Vx = (e) => Cx[e] ?? [e], Hx = (e) => /^@scope\b/i.test(e), Ux = /\._[\w-]/, Wx = 1e9, Gx = /^(width|height|inline-size|block-size|min-width|min-height|max-width|max-height|flex-basis|grid-template-columns|grid-template-rows)$/, Kx = (e, t) => t === "" ? Wx : e.rank.get(t) ?? e.rank.get(t.split(".")[0]) ?? -1, qx = (e, t, n) => {
	if (t.decl.important !== n.decl.important) return t.decl.important;
	let r = Kx(e, t.layer), i = Kx(e, n.layer);
	return ((t.decl.important ? i - r : r - i) || Nx(t.specificity, n.specificity) || t.rule - n.rule) > 0;
}, Jx = Fm(function* (e, t, n) {
	let r = yield* Bx, i = e.sheet.rules.filter((e) => e.decls.length && (!n || e.decls.some((e) => e.prop === n))), a = (e) => Dx(e.selector, ",").map((e) => ({
		full: e,
		...Ux.test(e) ? zx(e) : {
			base: e,
			states: []
		}
	})), o = i.filter((e) => e.wrap.some(Hx)), s = o.flatMap((e) => {
		let t = e.wrap.filter(Hx);
		return [{
			wrap: t,
			selector: a(e).map((e) => e.base).join(", ")
		}, {
			wrap: t,
			selector: e.selector
		}];
	}), c = yield* r.probe(t, s), l = [];
	for (let e of i) {
		let n = a(e), i = o.indexOf(e);
		if (i >= 0) {
			if (!c[2 * i]) continue;
			l.push({
				rule: e,
				specificity: n.map((e) => Lx(e.full)).reduce((e, t) => Nx(t, e) > 0 ? t : e),
				matched: !!c[2 * i + 1],
				states: n.flatMap((e) => e.states)
			});
			continue;
		}
		let s = [];
		for (let e of n) (yield* r.matches(t, e.base)) && s.push(e);
		if (!s.length) continue;
		let u = [];
		for (let e of s) (yield* r.matches(t, e.full)) && u.push(e);
		let d = (u.length ? u : s).map((e) => Lx(e.full));
		l.push({
			rule: e,
			specificity: d.reduce((e, t) => Nx(t, e) > 0 ? t : e),
			matched: u.length > 0,
			states: s.flatMap((e) => e.states)
		});
	}
	let u = [...new Set(l.flatMap((e) => e.rule.wrap.filter((e) => !Hx(e))))], d = yield* r.probe(t, u.map((e) => ({ wrap: [e] }))), f = new Map(u.map((e, t) => [e, !!d[t]]));
	return l.flatMap(({ rule: e, specificity: t, matched: r, states: i }) => {
		let a = [...e.wrap.map((e) => ({
			text: e,
			holds: Hx(e) || !!f.get(e)
		})), ...[...new Set(i)].map((e) => ({
			text: e,
			holds: r
		}))], o = r && a.every((e) => e.holds);
		return e.decls.flatMap((r) => n && r.prop !== n ? [] : [{
			rule: e.index,
			selector: e.selector,
			layer: e.layer,
			wrap: e.wrap,
			specificity: t,
			decl: r,
			conditions: a,
			applies: o
		}]);
	});
}), Yx = (e, t, n) => {
	let r = {
		prop: e.prop,
		computed: e.computed,
		expected: e.expected
	};
	if (e.computed === e.expected) return {
		...r,
		status: "ok"
	};
	if (e.inline) return {
		...r,
		status: "mismatch",
		reason: `the element's style attribute sets ${e.prop}: ${e.inline}`
	};
	let i = e.foreign.find((e) => e.important) ?? e.foreign.find((e) => e.layer === "") ?? e.foreign[0];
	return i ? {
		...r,
		status: "mismatch",
		reason: `${i.selector} { ${e.prop}: ${i.value}${i.important ? " !important" : ""} } in ${i.source.replace(`${n}/`, "")} beats it: ${i.layer ? `layer ${i.layer}` : "a rule outside every layer beats every layer, cssints' too"}`
	} : e.animated ? {
		...r,
		status: "mismatch",
		reason: "an animation or a transition is running on the element"
	} : Gx.test(e.prop) ? {
		...r,
		status: "unverified",
		reason: `${e.prop} depends on the element's content and layout, which the probe does not have`
	} : {
		...r,
		status: "mismatch",
		reason: `the browser computes ${e.computed}; ${t.selector} would give ${e.expected}`
	};
}, Xx = Fm(function* (e, t, n) {
	let r;
	for (let i of yield* Jx(e, t, n)) i.applies && (!r || qx(e, i, r)) && (r = i);
	return r;
}), Zx = Fm(function* (e, t, n) {
	let r = yield* Bx, i = e.sheet.inherits.get(n) ?? !0, a = t;
	for (let t = 0; a && t < 64; t++) {
		let t = yield* Xx(e, a, n);
		if (t) return {
			selector: t.selector,
			layer: t.layer,
			wrap: t.wrap,
			on: yield* r.label(a)
		};
		if (!i) return;
		a = yield* r.parent(a);
	}
}), Qx = /var\(\s*(--[\w-]+)/g, $x = Im("devtools.inspect")(function* (e, t) {
	let n = yield* Bx, { table: r } = e, i = yield* Jx(e, t), a = i.filter((e) => e.applies), o = i.filter((e) => !e.applies), s = /* @__PURE__ */ new Map();
	for (let t of a) for (let n of Vx(t.decl.prop)) {
		let r = s.get(n);
		(!r || qx(e, t, r)) && s.set(n, t);
	}
	let c = /* @__PURE__ */ new Map();
	for (let [e, t] of s) (c.get(t) ?? c.set(t, []).get(t)).push(e);
	let l = (e, t) => Vx(e.decl.prop).some((e) => t.includes(e)), u = [];
	for (let [e, i] of c) {
		let c = (yield* n.verify(t, e.decl.prop, e.selector, e.decl.value, i)).map((t) => Yx(t, e, r.root));
		u.push({
			prop: e.decl.prop,
			longhands: i,
			winner: e,
			lost: Vx(e.decl.prop).flatMap((t) => {
				let n = s.get(t);
				return n && n !== e ? [{
					prop: t,
					by: n
				}] : [];
			}),
			overridden: a.filter((t) => t !== e && l(t, i)),
			inactive: o.filter((e) => l(e, i)),
			verdicts: c
		});
	}
	let d = /* @__PURE__ */ new Map();
	for (let e of o) Vx(e.decl.prop).some((e) => s.has(e)) || (d.get(e.decl.prop) ?? d.set(e.decl.prop, []).get(e.decl.prop)).push(e);
	for (let [e, t] of d) u.push({
		prop: e,
		longhands: [...Vx(e)],
		lost: [],
		overridden: [],
		inactive: t,
		verdicts: []
	});
	u.sort((e, t) => Number(e.prop.startsWith("--")) - Number(t.prop.startsWith("--")) || (e.prop < t.prop ? -1 : +(e.prop > t.prop)));
	let f = yield* n.classes(t), p = new Map(i.map((e) => [e.rule, e])), m = (t) => {
		let n = r.classes[t];
		if (!n) return {
			cls: t,
			kind: "other",
			decls: [],
			conditions: [],
			active: !0,
			tokens: []
		};
		let i = n.kind === "class" ? e.rulesOf.get(t) ?? [] : [], a = i.flatMap((e) => p.get(e) ?? []), o = i[0] === void 0 ? void 0 : e.sheet.rules[i[0]], s = o ? Dx(o.selector, ",").flatMap((e) => zx(e).states) : [];
		return {
			cls: t,
			kind: n.kind,
			...n.plugin ? { plugin: n.plugin } : {},
			layer: n.layer,
			decls: i.flatMap((t) => e.sheet.rules[t]?.decls ?? []),
			conditions: a[0]?.conditions ?? [...n.wrap.map((e) => ({
				text: e,
				holds: !1
			})), ...s.map((e) => ({
				text: e,
				holds: !1
			}))],
			active: n.kind !== "class" || a.some((e) => e.applies),
			tokens: n.tokens
		};
	}, h = [], g = f.filter((e) => r.classes[e]);
	for (; g.length;) {
		let e;
		for (let t of g) for (let n of r.classes[t].sites) {
			let t = r.sites[n], i = t.classes.filter((e) => g.includes(e)).length;
			(!e || i > e.n || i === e.n && t.classes.length < e.site.classes.length) && (e = {
				site: t,
				n: i
			});
		}
		if (!e) break;
		let t = e.site;
		h.push({
			site: t,
			classes: g.filter((e) => t.classes.includes(e)).map(m)
		}), g = g.filter((e) => !t.classes.includes(e));
	}
	let _ = f.filter((e) => !h.some((t) => t.classes.some((t) => t.cls === e)));
	_.length && h.push({ classes: _.map(m) });
	let v = [.../* @__PURE__ */ new Set([...i.flatMap((e) => [...e.decl.value.matchAll(Qx)].map((e) => e[1])), ...f.flatMap((e) => r.classes[e]?.tokens ?? [])])].sort(), ee = yield* n.custom(t, v), te = [];
	for (let [n, i] of v.entries()) {
		let a = r.tokens[i], o = yield* Zx(e, t, i);
		te.push({
			name: i,
			...a ? {
				path: a.path,
				declared: a.value
			} : {},
			computed: ee[n] ?? "",
			registered: e.sheet.inherits.has(i),
			...o ? { source: o } : {}
		});
	}
	return {
		element: yield* n.label(t),
		root: r.root,
		groups: h,
		rows: u,
		tokens: te
	};
}), eS = "data-cssints-probe", tS = (e) => e.ownerNode instanceof Element && (e.ownerNode.getAttribute("data-vite-dev-id") ?? "").endsWith("virtual:cssints.css"), nS = (e, t) => sc(ac(() => e.matches(t)), () => !1), rS = (e) => {
	let t = [...e.attributes].find((e) => e.name.startsWith("data-") && e.name !== eS);
	return `${e.localName}${e.id ? `#${e.id}` : ""}${t ? `[${t.name}${t.value ? `="${t.value}"` : ""}]` : ""}`;
}, iS = (e, t) => {
	if (!t.length) return [];
	let n = e.ownerDocument.createElement("style");
	n.textContent = t.map(({ wrap: e, selector: t }, n) => {
		let r = t ? `:is(${t}):where([${eS}])` : `[${eS}]`;
		return `${e.map((e) => `${e} {`).join(" ")} ${r} { --cssints-probe-${n}: 1 } ${"}".repeat(e.length)}`;
	}).join("\n"), e.ownerDocument.head.append(n), e.setAttribute(eS, "");
	let r = getComputedStyle(e), i = t.map((e, t) => r.getPropertyValue(`--cssints-probe-${t}`).trim() === "1");
	return e.removeAttribute(eS), n.remove(), i;
}, aS = (e, t) => {
	let n = [], r = e.ownerDocument.defaultView, i = (a, o, s) => {
		for (let c of a) if (c instanceof CSSStyleRule) {
			let r = c.style.getPropertyValue(t);
			r && nS(e, c.selectorText) && n.push({
				selector: c.selectorText,
				source: o,
				layer: s,
				value: r,
				important: c.style.getPropertyPriority(t) === "important"
			}), i(c.cssRules, o, s);
		} else c instanceof CSSLayerBlockRule ? i(c.cssRules, o, s ? `${s}.${c.name}` : c.name) : c instanceof CSSMediaRule ? r?.matchMedia(c.conditionText).matches && i(c.cssRules, o, s) : c instanceof CSSSupportsRule ? CSS.supports(c.conditionText) && i(c.cssRules, o, s) : c instanceof CSSGroupingRule && i(c.cssRules, o, s);
	};
	for (let t of e.ownerDocument.styleSheets) {
		if (tS(t)) continue;
		let e = t.ownerNode instanceof Element ? t.ownerNode : void 0, n = t.href ?? e?.getAttribute("data-vite-dev-id") ?? `<${e?.localName ?? "style"}>`, r = cc(ac(() => t.cssRules));
		r && i(r, n, "");
	}
	return n;
}, oS = (e) => cc(ac(() => {
	let t = new CSSStyleSheet();
	t.insertRule(`${e} {}`);
	let n = t.cssRules[0];
	return n instanceof CSSStyleRule ? n.selectorText : void 0;
})), sS = (e, t, n) => {
	let r = oS(t);
	if (r === void 0) return;
	let i = [], a = (e, t) => {
		for (let o of e) if (o instanceof CSSStyleRule) {
			let e = o.style.getPropertyValue(n);
			e && o.selectorText === r && i.push({
				wrap: t,
				value: e
			});
		} else o instanceof CSSMediaRule ? a(o.cssRules, [...t, `@media ${o.conditionText}`]) : o instanceof CSSSupportsRule ? a(o.cssRules, [...t, `@supports ${o.conditionText}`]) : o instanceof CSSContainerRule ? a(o.cssRules, [...t, `@container ${o.conditionText}`]) : globalThis.CSSScopeRule && o instanceof CSSScopeRule ? a(o.cssRules, [...t, `@scope${o.start ? ` (${o.start})` : ""}${o.end ? ` to (${o.end})` : ""}`]) : o instanceof CSSGroupingRule && a(o.cssRules, t);
	}, o = [...e.ownerDocument.styleSheets], s = o.filter(tS);
	for (let e of s.length ? s : o) {
		let t = cc(ac(() => e.cssRules));
		t && a(t, []);
	}
	if (i.length < 2) return i[0]?.value;
	let c = iS(e, i.map(({ wrap: e }) => ({ wrap: e })));
	return i.findLast((e, t) => c[t])?.value ?? i.at(-1).value;
}, cS = /var\(\s*(--[\w-]+)/g, lS = (e, t, n, r, i) => {
	let a = e.cloneNode(!1);
	if (!(a instanceof Element) || !(a instanceof HTMLElement || a instanceof SVGElement)) return [];
	let o = t.startsWith("--") && sS(e, n, t) || r, s = getComputedStyle(e);
	for (let [, e] of o.matchAll(cS)) a.style.setProperty(e, s.getPropertyValue(e));
	a.style.setProperty(t, o, "important"), e.after(a);
	let c = getComputedStyle(a), l = e instanceof HTMLElement || e instanceof SVGElement ? e.style : void 0, u = e.getAnimations().length > 0, d = i.map((t) => {
		let n = s.getPropertyValue(t).trim(), r = c.getPropertyValue(t).trim();
		return {
			prop: t,
			computed: n,
			expected: r,
			inline: l?.getPropertyValue(t) ?? "",
			foreign: n === r ? [] : aS(e, t),
			animated: u
		};
	});
	return a.remove(), d;
}, uS = Ap(Bx, Bx.of({
	classes: (e) => X(() => [...e.classList]),
	label: (e) => X(() => rS(e)),
	parent: (e) => X(() => e.parentElement ?? void 0),
	matches: (e, t) => X(() => nS(e, t)),
	probe: (e, t) => X(() => iS(e, t)),
	custom: (e, t) => X(() => {
		let n = getComputedStyle(e);
		return t.map((e) => n.getPropertyValue(e).trim());
	}),
	verify: (e, t, n, r, i) => X(() => lS(e, t, n, r, i))
})), dS = 8, fS = 24, pS = 3, mS = 12, hS = 400, gS = (e, t) => t.startsWith(`${e}/`) ? t.slice(e.length + 1) : t, _S = (e, t) => e.length > t ? `${e.slice(0, t)}…` : e, vS = (e) => (e ?? "").replace(/\s+/g, " ").trim(), yS = (e) => {
	let t = e.parentElement, n = t?.parentElement;
	return [
		n?.parentElement,
		n,
		t,
		e
	].flatMap((e) => e ? [`${e.localName}${e.id ? `#${e.id}` : ""}`] : []).join(" > ");
}, bS = (e) => `${e.selector} (${e.layer || "unlayered"})`, xS = (e, t, n) => {
	let { root: r } = e, i = e.groups.flatMap((e) => e.site ? [e.site] : []), a = [
		"Change the UI of the running app as the instruction says.",
		"The styles are written with cssints: each `css.*` call below produced the classes of the element,",
		"so edit those calls (or the markup that uses them), not the generated class names.",
		"",
		`Instruction: ${n.trim()}`,
		"",
		`Element: <${e.element}>`,
		`DOM path: ${yS(t)}`,
		`Text: ${_S(vS(t.textContent), 120) || "(none)"}`,
		`Classes: ${[...t.classList].slice(0, 12).join(" ") || "(none)"}`,
		"",
		"Styled by (file:line, the call as written):"
	];
	i.length || a.push("- no cssints call: the element is styled elsewhere");
	for (let e of i.slice(0, dS)) a.push(`- ${gS(r, e.file)}:${e.line}`, `  ${_S(vS(e.text ?? ""), hS)}`);
	i.length > dS && a.push(`- … and ${i.length - dS} more`), a.push("", "Properties now (the winner, then what it beat):");
	for (let t of e.rows.slice(0, fS)) {
		if (!t.winner) continue;
		let e = t.winner, n = t.overridden.slice(0, pS).map((e) => `${e.decl.prop}: ${e.decl.value} ${bS(e)}`);
		a.push(`- ${e.decl.prop}: ${e.decl.value}${e.decl.important ? " !important" : ""} from ${bS(e)}` + (n.length ? `; overridden: ${n.join("; ")}` : ""));
	}
	if (e.rows.length > fS && a.push(`- … and ${e.rows.length - fS} more`), e.tokens.length) {
		a.push("", "Tokens it reads:");
		for (let t of e.tokens.slice(0, mS)) a.push(`- ${t.name} = ${t.computed || "(not set)"}${t.path ? ` (${t.path})` : ""}`);
	}
	return a.join("\n");
}, SS = qv({
	file: Gv,
	line: ey,
	column: ey,
	classes: Yv(Gv),
	text: Uv(Gv)
}), CS = qv({
	kind: Qv([
		"class",
		"marker",
		"group"
	]),
	layer: Gv,
	wrap: Yv(Gv),
	prop: Gv,
	css: Gv,
	tokens: Yv(Gv),
	plugin: Uv(Gv),
	sites: Yv(ey)
}), wS = qv({
	root: Gv,
	sheet: Gv,
	layers: Yv(Gv),
	classes: Jv(Gv, CS),
	sites: Yv(SS),
	tokens: Jv(Gv, qv({
		path: Gv,
		value: Gv
	}))
}), TS = class extends sl("TableError") {}, ES = Im("devtools.toModel")(function* (e) {
	let t = yield* Vv(wS)(e).pipe(mm((e) => new TS({ message: `cssints devtools: a bad table: ${e.message}` }))), n = yield* Ax(t.sheet), r = new Map(t.layers.map((e, t) => [e, t])), i = /* @__PURE__ */ new Map();
	for (let e of n.rules) for (let [, t] of e.selector.matchAll(/\.(_[\w-]+)/g)) {
		let n = i.get(t) ?? i.set(t, []).get(t);
		n.at(-1) !== e.index && n.push(e.index);
	}
	return {
		table: t,
		sheet: n,
		rank: r,
		rulesOf: i
	};
}), DS = "cssints:devtools", OS = "cssints:devtools:stale", kS = "cssints:devtools:asked", AS = class extends Ss()("@cssints/devtools/core/session/Transport") {}, jS = (e, t) => rx((n) => X(() => e.on(t, (e) => $y(n, e)))), MS = Im("devtools.session")(function* () {
	let e = yield* AS, t = yield* yx(void 0), n = yield* mx(!1), r = yield* mx(!0), i = gx(r, !1).pipe(om(X(() => e.request()))), a = $p(function* () {
		(yield* hx(n)) && (yield* hx(r)) && (yield* i);
	});
	return yield* Am(cx(jS(e, DS), (e) => ES(e).pipe(Z((e) => Sx(t, e)), fm("TableError", (e) => dx(e.message))))), yield* Am(cx(jS(e, OS).pipe(ox(() => gx(r, !0)), sx("60 millis")), () => a)), {
		model: t,
		setActive: (e) => gx(n, e).pipe(om(a))
	};
}), NS = "_1hqog5g _df4eqw _1vbyxpb _120vnyk _1t8gqy5 _1nu71z9 _14o2sa1 _1a8gflu _fjx7jy _16hpt8q _6to0fc _1lwcmvy _s7rk0y _1gqyter", PS = "_1hqog5g _120vnyj _z3zdsi _13tqlfe _1ecomh", FS = "_1f14wpf _rhyb7t _33i4pm _i1h5ry _1dh9zox _1h4s3ko _16hpt8q _6to0fc _184nt68", IS = "_1hqog5g _120vnyk _r0xwy4 _1a8gflu _fjx7jy _omr8bg _6to19l _dnf785", LS = "_4k81c2 _jveril _rv7stg _z6zrz5", RS = "_4k81c2 _33i4pm _rv7stg _e3rhh0", zS = "_4k81c2 _33i4pm _jveril _1fskg2z", BS = "_rv7stg _33i4pm _jveril _1pkekbt", VS = "_1hqog5g _120vnyk _1pan41p _4k81c2 _rv7stg _arb16l _2cr60o", HS = "_1hqog5g _120vnyk _1pan41p _33i4pm _jveril _1b2tqpi _v11v3x", US = "_1s47490 _1ob5z5m _g2iyum _6axxrf _4k81c2 _1t8gqy5 _1a8gflu _1fskg2z", WS = "_1wme27f _16hpt8q _1i8j81t", GS = "_i1h7gg _1kazld4 _14o2sa1 _k0i4ku _v4t4nx _fjx7jy _n5igo9 _1lwcmvy _1gmfivd", KS = "_1t8gqy5 _1fskg2z", qS = "_1q2li77 _6to0fc _17lglqt _n5339z _1n07ta0", JS = "_1jvfuo0 _g9h8t5 _v4i8ee _m367sd _v4t4nx _1k2b3pg _16hpt8q _6to0fc _1lwcmvy _1gt2bai _hyivqx", YS = "_16hpt8q _6to0fc _g9cs3h _1jjinuh _lqk467 _1waot2e _r0xwy4 _1ajqzk5 _tnb0cg", XS = "_1jvfuo0 _g9h8t5 _1k2b3pg _16hpt8q _6to0fc", ZS = "_1s4813v _1cl1tpz _g2iyum _1kazkiv _16hpt8q _6to0fc", QS = "_1c7it6z", $S = "_1n07ta0", eC = "_n7bsss _oir30p _i1h5ry _k0i3ql _14o2sa1 _16hpt8q _6tnzl3", tC = "_1kazn1m _1p6y9cw", nC = "_1s47490 _138gorg _g2iyum _16hpt8q", rC = "_g9ymq9 _6to0fc", iC = "_1wme27f _6to0fc _g9cs3h", aC = "_k9k5db _1n07ta0", oC = "_u6js88 _16hpt8q _6to0fc", sC = "_1lh9g66", cC = "_h3m4ra", lC = "_h3od5l", uC = "_u6js88 _h3m4ra _6to0fc", dC = "_1t8gqy5 _1n07ta0", fC = "_6axxrf _rv7stg _1t8gqy5 _1a8gflu _1pkekbt", pC = "_1jvfuo0 _1ywigwl _lqk467 _14o2sa1 _k0i4ku _1ajqzk5 _fjx7jy _n5igo9", mC = /* @__PURE__ */ A("<span>"), hC = /* @__PURE__ */ A("<div>except "), gC = /* @__PURE__ */ A("<div><div><span></span><!><!></div><!><!><!><!><!>"), _C = /* @__PURE__ */ A("<span>nothing applies now"), vC = /* @__PURE__ */ A("<span><!><!>"), yC = /* @__PURE__ */ A("<div><span></span> "), bC = /* @__PURE__ */ A("<div><span>: <!></span> <span>"), xC = /* @__PURE__ */ A("<div>: <!> <span></span> <!>"), SC = /* @__PURE__ */ A("<div>"), CC = /* @__PURE__ */ A("<div data-devtools=classes><h3>Classes by call"), wC = /* @__PURE__ */ A("<div data-devtools=properties><h3>Properties"), TC = /* @__PURE__ */ A("<div data-devtools=tokens><h3>Tokens"), EC = /* @__PURE__ */ A("<div><!><!>"), DC = /* @__PURE__ */ A("<div>no cssints call"), OC = /* @__PURE__ */ A("<button>:<!> ↗"), kC = /* @__PURE__ */ A("<pre data-call>"), AC = /* @__PURE__ */ A("<div>:<!>"), jC = /* @__PURE__ */ A("<div><span>.</span><span><!> <!></span><span>"), MC = /* @__PURE__ */ A("<div><div><span></span><span></span><span>"), NC = /* @__PURE__ */ A("<div>from <!> <!> <!> on <!>"), PC = /* @__PURE__ */ A("<button data-devtools=toggle title=\"cssints devtools (Alt+Shift+C)\">cssints"), FC = /* @__PURE__ */ A("<div data-devtools=ask><textarea data-devtools=ask-input rows=2 placeholder=\"Ask OpenCode to change this element (Enter sends)\">"), IC = /* @__PURE__ */ A("<aside data-devtools=panel><div><span data-devtools=element></span><button data-devtools=pick title=\"pick an element\">pick</button><button title=\"parent (↑)\">↑</button><button data-devtools=close title=\"close (Esc)\">×</button></div><!><!>"), LC = /* @__PURE__ */ A("<div data-devtools=grip>"), RC = /* @__PURE__ */ A("<div><span>"), zC = /* @__PURE__ */ A("<button data-devtools=dock>"), BC = /* @__PURE__ */ A("<div data-devtools=ask-status>"), VC = "@layer _.k{*{box-sizing:border-box}}@layer _.a{._n5igo9{font:inherit}._14o2sa1{border:1px solid #374151}._m367sd{border:none}._1jjinuh{margin:0 0 4px}._1nu71z9{border-radius:999px}._1t8gqy5{padding:.5rem}._99b8e4{border-color:#16a34a}._k0i3ql{border-radius:3px}._k0i4ku{border-radius:4px}._k9k5db{text-decoration:line-through}._lqk467{padding:.25rem}._v4i8ee{padding:0}._13tqlfe{outline:2px solid #60a5fa}._1fskg2z{border-bottom:1px solid #374151}._1p6y9cw{border-top:1px solid #1f2937}._1pkekbt{border-top:1px solid #374151}._e3rhh0{border-right:1px solid #374151}._z6zrz5{border-left:1px solid #374151}._184nt68{white-space:nowrap}._1kazkiv{padding-block:1px}._1kazld4{padding-block:2px}._1kazn1m{padding-block:4px}._1q2li77{margin-block:0 6px}._g2iyum{gap:.5rem}._i1h5ry{padding-inline:4px}._i1h7gg{padding-inline:6px}._r0xwy4{overflow:auto}._tnb0cg{white-space:pre}._120vnyj{z-index:2147483646}._120vnyk{z-index:2147483647}._138gorg{align-items:baseline}._16hpt8q{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}._17lglqt{text-transform:uppercase}._1a8gflu{background-color:#111827}._1ajqzk5{background-color:#0b1220}._1b2tqpi{height:6px}._1c7it6z{opacity:.5}._1cl1tpz{grid-template-columns:auto 1fr auto}._1dh9zox{background-color:#60a5fa}._1ecomh{background-color:#60a5fa1f}._1f14wpf{position:absolute}._1gt2bai{text-align:start}._1h4s3ko{color:#0b1220}._1hqog5g{position:fixed}._1i8j81t{font-weight:600}._1jvfuo0{display:block}._1k2b3pg{color:#60a5fa}._1lh9g66{color:#86efac}._1lwcmvy{cursor:pointer}._1n07ta0{color:#9ca3af}._1ob5z5m{align-items:center}._1pan41p{touch-action:none}._1s47490{display:flex}._1s4813v{display:grid}._1vbyxpb{bottom:12px}._1waot2e{max-height:120px}._1wme27f{flex-grow:1}._1ywigwl{width:100%}._2cr60o{cursor:ew-resize}._33i4pm{left:0}._4k81c2{top:0}._6axxrf{position:sticky}._6tnzl3{font-size:10px}._6to0fc{font-size:11px}._6to19l{font-size:12px}._arb16l{width:6px}._df4eqw{right:12px}._dnf785{line-height:1.45}._fjx7jy{color:#e5e7eb}._g9cs3h{overflow-wrap:anywhere}._g9h8t5{margin-bottom:2px}._g9ymq9{color:#f9a8d4}._h3m4ra{color:#fca5a5}._h3od5l{color:#fcd34d}._jveril{right:0}._n5339z{letter-spacing:.06em}._n7bsss{display:inline-block}._oir30p{margin-inline-end:4px}._omr8bg{font-family:system-ui,sans-serif}._rhyb7t{top:-20px}._rv7stg{bottom:0}._s7rk0y{opacity:.75}._u6js88{padding-inline-start:12px}._v11v3x{cursor:ns-resize}._v4t4nx{background-color:#0000}._z3zdsi{pointer-events:none}}@layer _.b{._1gmfivd:hover{border-color:#60a5fa}._hyivqx:hover{text-decoration:underline}._1gqyter:hover{opacity:1}}@layer _.c,_.d,_.e;\n/*$vite$:1*/", HC = "cssints-devtools", UC = (...e) => e.filter(Boolean).join(" "), WC = [
	"left",
	"top",
	"bottom",
	"right"
], GC = {
	left: "◧",
	top: "⬒",
	bottom: "⬓",
	right: "◨"
}, KC = {
	left: RS,
	top: zS,
	bottom: BS,
	right: LS
}, qC = "cssints-devtools:dock", JC = 200, YC = () => {
	try {
		return JSON.parse(localStorage.getItem(qC) ?? "null");
	} catch {
		return null;
	}
}, XC = () => {
	let e = YC(), t = (e, t) => typeof e == "number" && e >= JC ? e : t;
	return {
		dock: WC.find((t) => t === e?.dock) ?? "right",
		w: t(e?.w, 440),
		h: t(e?.h, 320)
	};
}, ZC = (e) => {
	try {
		localStorage.setItem(qC, JSON.stringify(e));
	} catch {}
}, QC = (e, t) => {
	let n = Pm($x(e, t).pipe(xm(uS)));
	return tp(n) ? n.value : String(n.cause);
}, $C = (e, t, n) => void fetch(`/__open-in-editor?file=${encodeURIComponent(`${e}:${t}:${n + 1}`)}`), ew = (e) => O(Mr, {
	get each() {
		return e.of;
	},
	children: (e) => (() => {
		var t = mC();
		return P(t, () => e.text), k(() => ({
			e: N(UC(eC, e.holds && "_99b8e4 _1lh9g66")),
			t: e.holds ? "holds now" : "does not hold now"
		}), ({ e, t: n }, r) => {
			M(t, e, r?.e), n !== r?.t && j(t, "title", n);
		}), t;
	})()
}), tw = (e) => `${e.selector}  ${e.layer || "unlayered"}`;
function nw(e) {
	let t = () => {
		let t = e.row.verdicts;
		return t.find((e) => e.status === "mismatch") ?? t.find((e) => e.status === "unverified") ?? t[0];
	};
	var n = gC(), r = n.firstChild, i = r.firstChild, a = i.nextSibling, o = a.nextSibling, s = r.nextSibling, c = s.nextSibling, l = c.nextSibling, u = l.nextSibling, d = u.nextSibling;
	return P(i, () => e.row.prop), P(r, O(Nr, {
		get when() {
			return e.row.winner;
		},
		get fallback() {
			var e = _C();
			return k(() => N(UC(iC, $S)), (t, n) => {
				M(e, t, n);
			}), e;
		},
		children: (e) => (() => {
			var t = vC(), n = t.firstChild, r = n.nextSibling;
			return P(t, () => e().decl.value, n), P(t, () => e().decl.important ? " !important" : "", r), k(() => ({
				e: N(iC),
				t: e().selector,
				a: e().decl.value
			}), ({ e, t: n, a: r }, i) => {
				M(t, e, i?.e), n !== i?.t && j(t, "data-winner", n), r !== i?.a && j(t, "data-value", r);
			}), t;
		})()
	}), a), P(r, O(Nr, {
		get when() {
			return t();
		},
		children: (e) => (() => {
			var t = mC();
			return P(t, (() => {
				var t = zr(() => e().status === "ok");
				return () => t() ? "✓" : e().status === "mismatch" ? "✗" : "?";
			})()), k(() => ({
				e: N(e().status === "ok" ? sC : e().status === "mismatch" ? cC : lC),
				t: e().reason ?? `computed ${e().computed}`,
				a: e().computed
			}), ({ e, t: n, a: r }, i) => {
				M(t, e, i?.e), n !== i?.t && j(t, "title", n), r !== i?.a && j(t, "data-computed", r);
			}), t;
		})()
	}), o), P(n, O(Nr, {
		get when() {
			return e.row.winner;
		},
		children: (e) => (() => {
			var t = yC(), n = t.firstChild;
			return n.nextSibling, P(n, () => tw(e())), P(t, O(ew, { get of() {
				return e().conditions;
			} }), null), k(() => ({
				e: N(oC),
				t: N($S)
			}), ({ e, t: r }, i) => {
				M(t, e, i?.e), M(n, r, i?.t);
			}), t;
		})()
	}), s), P(n, O(Nr, {
		get when() {
			return e.row.lost.length;
		},
		get children() {
			var t = hC();
			return t.firstChild, P(t, () => e.row.lost.map((e) => `${e.prop} (${e.by.selector})`).join(", "), null), k(() => N(UC(oC, $S)), (e, n) => {
				M(t, e, n);
			}), t;
		}
	}), c), P(n, O(Mr, {
		get each() {
			return e.row.overridden;
		},
		children: (e) => (() => {
			var t = bC(), n = t.firstChild, r = n.firstChild, i = r.nextSibling, a = n.nextSibling.nextSibling;
			return P(n, () => e.decl.prop, r), P(n, () => e.decl.value, i), P(a, () => tw(e)), k(() => ({
				e: N(oC),
				t: e.selector,
				a: N(aC),
				o: N($S)
			}), ({ e, t: r, a: i, o }, s) => {
				M(t, e, s?.e), r !== s?.t && j(t, "data-overridden", r), M(n, i, s?.a), M(a, o, s?.o);
			}), t;
		})()
	}), l), P(n, O(Mr, {
		get each() {
			return e.row.inactive;
		},
		children: (e) => (() => {
			var t = xC(), n = t.firstChild, r = n.nextSibling, i = r.nextSibling.nextSibling, a = i.nextSibling.nextSibling;
			return P(t, () => e.decl.prop, n), P(t, () => e.decl.value, r), P(i, () => tw(e)), P(t, O(ew, { get of() {
				return e.conditions;
			} }), a), k(() => ({
				e: N(UC(oC, QS)),
				t: e.selector,
				a: N($S)
			}), ({ e, t: n, a: r }, a) => {
				M(t, e, a?.e), n !== a?.t && j(t, "data-inactive", n), M(i, r, a?.a);
			}), t;
		})()
	}), u), P(n, O(Mr, {
		get each() {
			return e.row.verdicts.filter((e) => e.reason);
		},
		children: (e) => (() => {
			var t = SC();
			return P(t, () => e.reason), k(() => N(e.status === "mismatch" ? uC : UC(oC, lC)), (e, n) => {
				M(t, e, n);
			}), t;
		})()
	}), d), k(() => ({
		e: N(tC),
		t: e.row.prop,
		a: t()?.status ?? "none",
		o: N(nC),
		i: N(rC)
	}), ({ e, t, a, o, i: s }, c) => {
		M(n, e, c?.e), t !== c?.t && j(n, "data-prop", t), a !== c?.a && j(n, "data-status", a), M(r, o, c?.o), M(i, s, c?.i);
	}), n;
}
var rw = (e, t) => e === t || JSON.stringify(e) === JSON.stringify(t);
function iw(e) {
	let t = () => e.inspection;
	return [
		(() => {
			var n = CC(), r = n.firstChild;
			return P(n, O(Mr, {
				get each() {
					return t().groups;
				},
				children: (n) => (() => {
					var r = EC(), i = r.firstChild, a = i.nextSibling;
					return P(r, O(Nr, {
						get when() {
							return n.site;
						},
						get fallback() {
							var e = DC();
							return k(() => N($S), (t, n) => {
								M(e, t, n);
							}), e;
						},
						children: (n) => [O(Nr, {
							get when() {
								return !e.build;
							},
							get fallback() {
								var e = AC(), r = e.firstChild, i = r.nextSibling;
								return P(e, () => gS(t().root, n().file), r), P(e, () => n().line, i), k(() => ({
									e: N(XS),
									t: `${gS(t().root, n().file)}:${n().line}`
								}), ({ e: t, t: n }, r) => {
									M(e, t, r?.e), n !== r?.t && j(e, "data-site", n);
								}), e;
							},
							get children() {
								var e = OC(), r = e.firstChild, i = r.nextSibling;
								return i.nextSibling, e._$$click = () => $C(n().file, n().line, n().column), P(e, () => gS(t().root, n().file), r), P(e, () => n().line, i), k(() => ({
									e: N(JS),
									t: `${gS(t().root, n().file)}:${n().line}`
								}), ({ e: t, t: n }, r) => {
									M(e, t, r?.e), n !== r?.t && j(e, "data-site", n);
								}), e;
							}
						}), O(Nr, {
							get when() {
								return n().text;
							},
							get children() {
								var e = kC();
								return P(e, () => n().text), k(() => N(YS), (t, n) => {
									M(e, t, n);
								}), e;
							}
						})]
					}), i), P(r, O(Mr, {
						get each() {
							return n.classes;
						},
						children: (e) => (() => {
							var t = jC(), n = t.firstChild;
							n.firstChild;
							var r = n.nextSibling, i = r.firstChild, a = i.nextSibling, o = a.nextSibling, s = r.nextSibling;
							return P(n, () => e.cls, null), P(r, (() => {
								var t = zr(() => e.kind === "marker");
								return () => t() ? `marker of kernel ${e.plugin}` : zr(() => e.kind === "group")() ? "group marker" : zr(() => e.kind === "other")() ? "not cssints" : e.decls.map((e) => `${e.prop}: ${e.value}`).join("; ");
							})(), i), P(r, (() => {
								var t = zr(() => !!(e.kind === "class" && e.plugin));
								return () => t() ? `  (${e.plugin})` : "";
							})(), a), P(r, O(ew, { get of() {
								return e.conditions;
							} }), o), P(s, () => e.layer), k(() => ({
								e: N(UC(ZS, !e.active && "_1c7it6z")),
								t: e.cls,
								a: N($S)
							}), ({ e, t: n, a: r }, i) => {
								M(t, e, i?.e), n !== i?.t && j(t, "data-class", n), M(s, r, i?.a);
							}), t;
						})()
					}), a), r;
				})()
			}), null), k(() => ({
				e: N(KS),
				t: N(qS)
			}), ({ e, t }, i) => {
				M(n, e, i?.e), M(r, t, i?.t);
			}), n;
		})(),
		(() => {
			var e = wC(), n = e.firstChild;
			return P(e, O(Mr, {
				get each() {
					return t().rows;
				},
				children: (e) => O(nw, { row: e })
			}), null), k(() => ({
				e: N(KS),
				t: N(qS)
			}), ({ e: t, t: r }, i) => {
				M(e, t, i?.e), M(n, r, i?.t);
			}), e;
		})(),
		O(Nr, {
			get when() {
				return t().tokens.length;
			},
			get children() {
				var e = TC(), n = e.firstChild;
				return P(e, O(Mr, {
					get each() {
						return t().tokens;
					},
					children: (e) => (() => {
						var t = MC(), n = t.firstChild, r = n.firstChild, i = r.nextSibling, a = i.nextSibling;
						return P(r, () => e.name), P(i, () => e.computed || "(not set)"), P(a, () => e.path), P(t, O(Nr, {
							get when() {
								return e.source;
							},
							get fallback() {
								var t = SC();
								return P(t, () => e.registered ? "the initial value of its @property" : "not set by cssints"), k(() => N(UC(oC, $S)), (e, n) => {
									M(t, e, n);
								}), t;
							},
							children: (e) => (() => {
								var t = NC(), n = t.firstChild.nextSibling, r = n.nextSibling.nextSibling, i = r.nextSibling.nextSibling, a = i.nextSibling.nextSibling;
								return P(t, () => e().wrap.join(" "), n), P(t, () => e().selector, r), P(t, () => e().layer || "unlayered", i), P(t, () => e().on, a), k(() => N(UC(oC, $S)), (e, n) => {
									M(t, e, n);
								}), t;
							})()
						}), null), k(() => ({
							e: N(tC),
							t: e.name,
							a: N(nC),
							o: N(rC),
							i: N(iC),
							n: N($S)
						}), ({ e, t: o, a: s, o: c, i: l, n: u }, d) => {
							M(t, e, d?.e), o !== d?.t && j(t, "data-token", o), M(n, s, d?.a), M(r, c, d?.o), M(i, l, d?.i), M(a, u, d?.n);
						}), t;
					})()
				}), null), k(() => ({
					e: N(KS),
					t: N(qS)
				}), ({ e: t, t: r }, i) => {
					M(e, t, i?.e), M(n, r, i?.t);
				}), e;
			}
		})
	];
}
var aw = (e) => e.firstElementChild ?? void 0;
function ow(e) {
	let [t, n] = Dr(!1), [r, i] = Dr(!1), [a, o] = Dr(), [s, c] = Dr(), [l, u] = Dr(0), [d, f] = Dr(XC()), p = () => d().dock === "left" || d().dock === "right", m = (e) => {
		f((t) => ({
			...t,
			dock: e
		})), ZC(d());
	}, h = (e) => {
		if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
		let { dock: t } = d(), n = {
			left: e.clientX,
			top: e.clientY,
			right: innerWidth - e.clientX,
			bottom: innerHeight - e.clientY
		}, r = Math.round(Math.max(JC, Math.min(n[t], (p() ? innerWidth : innerHeight) - 80)));
		f((e) => p() ? {
			...e,
			w: r
		} : {
			...e,
			h: r
		});
	}, g = () => {
		let { dock: e, w: t, h: n } = d(), r = p() ? `calc(min(${t}px, 100vw) - 3px)` : `calc(min(${n}px, 100vh) - 3px)`;
		return Object.fromEntries(WC.map((t) => [t, t === e ? r : ""]));
	}, _ = () => r() ? a() ?? s() : s(), [v, ee] = Dr();
	Ar(() => e.asked()?.status, (e) => {
		let t = v();
		e === "running" && t && (t.value = "");
	});
	let te = () => {
		let t = e.model(), n = s(), r = v()?.value.trim(), i = t && n?.isConnected ? QC(t, n) : void 0;
		r && n && typeof i == "object" && e.ask?.(xS(i, n, r));
	}, ne = (r = !t()) => {
		n(r), i(r && !s()), e.setActive(r);
	}, re = Er(() => {
		l();
		let n = e.model(), r = _();
		return t() && n && r?.isConnected ? QC(n, r) : void 0;
	}, { equals: rw }), ie = Er(() => (l(), t() ? _()?.getBoundingClientRect() : void 0));
	return nr(() => {
		let n = (t) => t.composedPath().includes(e.host), l = (e) => {
			r() && !n(e) && e.target instanceof Element && e.target !== a() && o(e.target);
		}, d = (e) => {
			r() && !n(e) && e.target instanceof Element && (e.preventDefault(), e.stopPropagation(), c(e.target), i(!1));
		}, f = (n) => {
			if (n.altKey && n.shiftKey && n.code === "KeyC") {
				n.preventDefault(), ne();
				return;
			}
			if (!t()) return;
			if (n.key === "Escape") {
				n.preventDefault(), r() && s() ? i(!1) : ne(!1);
				return;
			}
			if (n.composedPath()[0] instanceof HTMLTextAreaElement) return;
			let a = s();
			if (!a || r()) return;
			let o = n.key === "ArrowUp" ? a.parentElement ?? void 0 : n.key === "ArrowDown" ? aw(a) : n.key === "ArrowLeft" ? a.previousElementSibling ?? void 0 : n.key === "ArrowRight" ? a.nextElementSibling ?? void 0 : void 0;
			o && o !== e.host && (n.preventDefault(), c(o));
		}, p = setInterval(() => t() && u((e) => e + 1), 600);
		return document.addEventListener("pointermove", l, !0), document.addEventListener("click", d, !0), window.addEventListener("keydown", f, !0), () => {
			clearInterval(p), document.removeEventListener("pointermove", l, !0), document.removeEventListener("click", d, !0), window.removeEventListener("keydown", f, !0);
		};
	}), Xn(() => e.setActive(!1)), nr(() => {
		e.build && ne(!0);
	}), [
		(() => {
			var e = PC();
			return e._$$click = () => ne(), k(() => N(NS), (t, n) => {
				M(e, t, n);
			}), e;
		})(),
		O(Nr, {
			get when() {
				return ie();
			},
			children: (e) => (() => {
				var t = RC(), n = t.firstChild;
				return P(n, (() => {
					var e = zr(() => typeof re() == "object");
					return () => e() ? re().element : "";
				})()), k(() => ({
					e: N(PS),
					t: `${e().top}px`,
					a: `${e().left}px`,
					o: `${e().width}px`,
					i: `${e().height}px`,
					n: N(FS)
				}), ({ e, t: r, a: i, o: a, i: o, n: s }, c) => {
					M(t, e, c?.e), r !== c?.t && ai(t, "top", r), i !== c?.a && ai(t, "left", i), a !== c?.o && ai(t, "width", a), o !== c?.i && ai(t, "height", o), M(n, s, c?.n);
				}), t;
			})()
		}),
		O(Nr, {
			get when() {
				return t();
			},
			get children() {
				return [(() => {
					var t = IC(), n = t.firstChild, a = n.firstChild, o = a.nextSibling, l = o.nextSibling, u = l.nextSibling, f = n.nextSibling, h = f.nextSibling;
					return P(a, (() => {
						var e = zr(() => typeof re() == "object");
						return () => e() ? re().element : "pick an element";
					})()), o._$$click = () => i(!r()), P(n, O(Mr, {
						each: WC,
						children: (e) => (() => {
							var t = zC();
							return t._$$click = () => m(e), j(t, "data-dock", e), j(t, "title", `dock ${e}`), P(t, () => GC[e]), k(() => N(UC(GS, d().dock === e && "_1dh9zox _1h4s3ko")), (e, n) => {
								M(t, e, n);
							}), t;
						})()
					}), l), l._$$click = () => c((e) => e?.parentElement ?? e), u._$$click = () => ne(!1), P(t, O(Nr, {
						get when() {
							return e.model();
						},
						get fallback() {
							var t = SC();
							return P(t, () => e.build ? "loading the table…" : "waiting for the dev server…"), k(() => N(dC), (e, n) => {
								M(t, e, n);
							}), t;
						},
						get children() {
							return O(Nr, {
								get when() {
									return zr(() => typeof re() == "object")() ? re() : void 0;
								},
								get fallback() {
									var e = SC();
									return P(e, (() => {
										var e = zr(() => typeof re() == "string");
										return () => e() ? re() : "hover an element and click to pick it";
									})()), k(() => N(dC), (t, n) => {
										M(e, t, n);
									}), e;
								},
								children: (t) => O(iw, {
									get inspection() {
										return t();
									},
									get build() {
										return e.build;
									}
								})
							});
						}
					}), f), P(t, O(Nr, {
						get when() {
							return zr(() => !!e.ask)() ? s() : e.ask;
						},
						get children() {
							var t = FC(), n = t.firstChild;
							return n._$$keydown = (e) => {
								e.key === "Enter" && !e.shiftKey && !e.isComposing && (e.preventDefault(), te());
							}, si(() => ee, n), P(t, O(Nr, {
								get when() {
									return e.asked();
								},
								children: (e) => (() => {
									var t = BC();
									return P(t, () => e().message ?? `${e().status}${e().id ? ` · ${e().id}` : ""}`), k(() => ({
										e: N(UC(oC, e().status === "completed" ? sC : e().status === "running" || e().status === "sending" ? $S : cC)),
										t: e().status,
										a: e().id
									}), ({ e, t: n, a: r }, i) => {
										M(t, e, i?.e), n !== i?.t && j(t, "data-status", n), r !== i?.a && j(t, "title", r);
									}), t;
								})()
							}), null), k(() => ({
								e: N(fC),
								t: N(pC)
							}), ({ e, t: r }, i) => {
								M(t, e, i?.e), M(n, r, i?.t);
							}), t;
						}
					}), h), k(() => ({
						e: N(UC(IS, KC[d().dock])),
						t: d().dock,
						a: N(p() ? {
							width: `min(${d().w}px, 100vw)`,
							height: ""
						} : {
							height: `min(${d().h}px, 100vh)`,
							width: ""
						}),
						o: N(US),
						i: N(WS),
						n: N(UC(GS, r() && "_1dh9zox _1h4s3ko")),
						s: r() ? "yes" : "no",
						h: N(GS),
						r: N(GS)
					}), ({ e, t: r, a: i, o: s, i: c, n: d, s: f, h: p, r: m }, h) => {
						M(t, e, h?.e), r !== h?.t && j(t, "data-dock", r), ii(t, i, h?.a), M(n, s, h?.o), M(a, c, h?.i), M(o, d, h?.n), f !== h?.s && j(o, "data-on", f), M(l, p, h?.h), M(u, m, h?.r);
					}), t;
				})(), (() => {
					var e = LC();
					return e._$$pointerup = () => ZC(d()), e._$$pointermove = h, e._$$pointerdown = (e) => {
						e.currentTarget.setPointerCapture(e.pointerId), e.preventDefault();
					}, k(() => ({
						e: N(p() ? VS : HS),
						t: N(g())
					}), ({ e: t, t: n }, r) => {
						M(e, t, r?.e), ii(e, n, r?.t);
					}), e;
				})()];
			}
		})
	];
}
function sw(e) {
	if (document.querySelector(HC)) return;
	let t = document.createElement(HC);
	t.setAttribute("style", "all: initial");
	let n = t.attachShadow({ mode: "open" }), r = document.createElement("style");
	r.textContent = VC;
	let i = document.createElement("div");
	n.append(r, i), document.documentElement.append(t);
	let a = Nm(MS().pipe(Sm(AS, e))), [o, s] = Dr();
	jm(cx(bx(a.model), (e) => X(() => s(() => e))));
	let [c, l] = Dr(), u = { ref: 0 }, d = e.ask && ((t) => {
		l({ status: "sending" }), u.ref += 1, e.ask?.(u.ref, t);
	});
	d && e.on(kS, (e) => {
		let t = e;
		t.ref === u.ref && l((e) => ({
			...e,
			...t
		}));
	}), qr(() => O(ow, {
		model: o,
		setActive: (e) => Nm(a.setActive(e)),
		host: t,
		get build() {
			return e.build;
		},
		ask: d,
		asked: c
	}), i);
}
Yr([
	"click",
	"keydown",
	"pointerdown",
	"pointermove",
	"pointerup"
]);
//#endregion
export { sw as mount };
