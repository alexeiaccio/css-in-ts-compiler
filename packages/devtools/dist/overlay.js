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
var ee = {}, te = Symbol("refresh"), ne = /* @__PURE__ */ new Set();
function re(e) {
	for (; e.ei;) e = e.ei;
	return e;
}
function ie(e, t) {
	if (e = re(e), t = re(t), e === t) return e;
	t.ei = e;
	for (let n of t.Qe) e.Qe.add(n);
	return t.Qe.clear(), e.dn[0].push(...t.dn[0]), e.dn[1].push(...t.dn[1]), t.dn[0].length = 0, t.dn[1].length = 0, e;
}
function ae(e) {
	let t = e.o?.me;
	if (!t) return;
	let n = re(t);
	if (ne.has(n)) return n;
	e.o !== null && (e.o.me = void 0);
}
function oe(e) {
	if (jn(e) && e.o?.Ln) {
		let t = E(e).Ln = tt(e.o?.Ln);
		if (t.Rn !== !0) return t;
		e.o !== null && (e.o.Ln = null);
	}
	return ae(e)?.we ?? e.we;
}
function se(e, t) {
	let n = re(t), r = e.o?.me;
	if (r) {
		let i = re(r);
		if (ne.has(i)) {
			i !== n && (!jn(e) || e.C & 8388608) && (n.ii && re(n.ii) === i ? (E(e).me = t, e.C |= o) : i.ii && re(i.ii) === n || ie(n, i));
			return;
		}
	}
	E(e).me = t, e.C |= o;
}
//#endregion
//#region ../../node_modules/.bun/@solidjs+signals@2.0.0-rc.13/node_modules/@solidjs/signals/dist/prod/core/scheduler.js
var ce = /* @__PURE__ */ new Set(), v = {
	eE: Array(2e3).fill(void 0),
	tE: !1,
	ln: 0,
	EE: 0
}, le = {
	eE: Array(2e3).fill(void 0),
	tE: !1,
	ln: 0,
	EE: 0
};
function ue(e) {
	if (e.oe & 128 && !de(e)) return S.Ke(e);
	e.oe & 16 ? e.oe &= -140 : (ut(e, le), e.oe &= -132);
}
function de(e) {
	let t = e;
	for (; t !== null && t.oe & 32;) t = t._parent;
	return t !== null && !!(t.C & 67108864);
}
var y = 0, b = null, fe = !1, pe = !1, me = !1, he = 0, ge = !1, _e = 0, ve = /* @__PURE__ */ new Set();
function ye(e) {
	let t = e.m;
	return ce.size === 0 && ne.size === 0 && e.ft.length === 0 && t.cn.length === 0 && t.A.length === 0 && t.ti.size === 0 && ve.size === 0 && Ee.size === 0;
}
function be() {
	if (ve.size !== 0) for (let e of ve) {
		if (e.u !== null) {
			ve.delete(e);
			continue;
		}
		e._e === h && (e.o?.Fe === void 0 || e.o?.Fe === h) && (e.o?.t || (ve.delete(e), e.C & 262144 ? pn(e) : e.o?.Hn?.()));
	}
}
function xe() {
	return {
		be: y,
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
function Se(e, t) {
	t.Rn = e, e.pe.push(...t.pe), e.Te ||= t.Te;
	for (let n of ne) n.we === t && (n.we = e);
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
var Ce = !1;
function x() {
	if (pe) {
		je();
		return;
	}
	fe || (fe = !0, !he && !C.Jn && (Ce = ge, Ce || queueMicrotask(Xe)));
}
var we = [];
function Te() {
	for (let e of ce) we.includes(e) || we.push(e);
	x();
}
var Ee = /* @__PURE__ */ new Set();
function De() {
	let e = Array.from(Ee);
	Ee.clear();
	for (let t = 0; t < e.length; t++) e[t].se();
}
var Oe = [], ke = Symbol.for("solid-js/root-error-hook");
function Ae(e) {
	if (pe) return;
	pe = !0;
	let t = "[REACTIVITY_HALTED]", n = e !== void 0 && globalThis.reportError;
	n || e === void 0 ? console.error(t) : console.error(t, e), n && n(e);
}
function je() {
	me || (me = !0, console.error("[REACTIVITY_HALTED]"));
}
var Me = 0, Ne = class {
	_parent = null;
	Tt = [[], []];
	ft = [];
	ht = 0;
	created = y;
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
			this.Tt[e - 1] = [], Ze(t, e);
		}
		let t = this.ft, n = ++Me;
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
		e && (T ? re(T).dn[e - 1].push(t) : this.Tt[e - 1].push(t)), x();
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
}, S = class e extends Ne {
	Jn = !1;
	m = xe();
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
			if (b === null && v.EE < v.ln && this.Tt[0].length === 0 && this.Tt[1].length === 0 && this.ft.length === 0 && !we.length && !Oe.length && ye(this)) {
				this.Jn = !0;
				try {
					Fn(), Nt(), Ge();
				} finally {
					this.Jn = !1;
				}
				y++, fe = v.EE >= v.ln || this.Tt[0].length !== 0 || this.Tt[1].length !== 0 || this.m.Gn.length !== 0;
				return;
			}
			this.Jn = !0, Fn();
			try {
				for (; Oe.length;) this.initTransition(Oe.pop());
				if (Nt(), pt(v, e.Ke), b && e.Ei?.(b) && pt(v, e.Ke), Ee.size && (De(), pt(v, e.Ke)), b) {
					if (this.ft.length && (qe(this, !0), v.EE >= v.ln && pt(v, e.Ke)), !et(b)) {
						let t = b;
						We.length = 0, pt(le, this.m === t ? ue : e.Ke), this.m === t && (Ye = this.m = xe()), ne.size && (e.si(1), e.si(2)), this.stashQueues(t.dt), y++, fe = v.EE >= v.ln || this.m.Gn.length > 0, Je(t.Gn), b = null, Ke(null, !0);
						return;
					}
					let t = b, n = this.m;
					if (n !== t && n.Gn.push(...t.Gn), this.restoreQueues(t.dt), ce.delete(t), b = null, Je(n.Gn), Ke(t), n === t) {
						let e = xe();
						e.Gn = n.Gn, e.cn = n.cn, e.A = n.A, e.ti = n.ti, Ye = this.m = e;
					}
				} else ye(this) ? (Ge(), v.EE >= v.ln && (pt(v, e.Ke), Ge())) : (ce.size && (Ge(), pt(le, e.Ke)), Ke());
				y++, fe = v.EE >= v.ln || b !== null || this.m.Gn.length !== 0, ne.size && e.si(1), this.run(1), ne.size && e.si(2), this.run(2);
			} finally {
				for (; !fe && !b && we.length;) this.initTransition(we.pop());
				this.Jn = !1;
			}
		}
	}
	notify(t, n, r, i) {
		if (n & 1) {
			if (r & 1) {
				let n = i ?? t.o?._;
				if (n?.l) return !0;
				if (n && (!b && !t.we && Ye.Gn.length && this.initTransition(), b)) {
					let r = n.source, i = b.le.get(r);
					i || b.le.set(r, i = /* @__PURE__ */ new Set());
					let a = i.size;
					i.add(t), i.size !== a && (x(), e.Nt?.(b));
				}
			}
			return !0;
		}
		return !1;
	}
	initTransition(e) {
		if (e && (e = tt(e), e.Rn === !0 || e === b) || !e && b && b.be === y) return;
		if (!b) b = e ?? xe();
		else if (e) {
			let t = b;
			Se(e, t), this.restoreQueues(t.dt), ce.delete(t), b = e;
		}
		ce.add(b), b.be = y;
		let t = this.m;
		if (t !== b) {
			let e = this.Jn ? 0 : m;
			for (let n = 0; n < t.Gn.length; n++) {
				let r = t.Gn[n];
				if (r.we === null && r._e !== h && (!r.he || r.oe & 1024 && !(r.h & 4)) && r.xe && r.xe(r.ce, r._e)) {
					r._e = h, Ve(r);
					continue;
				}
				r.we = b, r.C |= e, b.Gn.push(r);
			}
			for (let e = 0; e < t.cn.length; e++) {
				let n = t.cn[e];
				n.we = b, b.cn.push(n);
			}
			t.A.length && b.A.push(...t.A);
			for (let e of t.ti) b.ti.add(e);
			if (t.In.size) {
				for (let e of t.In) b.In.add(e);
				t.In.clear();
			}
			Ye = this.m = b;
		}
		for (let e of ne) e.we ||= b;
		x();
	}
};
function Pe(e) {
	Ye.Gn.push(e), C.Jn || En();
}
var Fe = !1, Ie = 0;
function Le() {
	Ie++;
}
var Re = 0;
function ze(e) {
	let t = Re;
	return Re = e, t;
}
function Be(e, t = !1) {
	e.vn = Ie;
	let n = e.C, r = (n & 1024 ? e.o?.me : void 0) || T, o = !!(n & 512) && e.o?.sn !== void 0, s = Fe;
	for (let n = e.u; n !== null; n = n.Ae) {
		let e = n.ge;
		if (s && (e.oe &= ~i), e.oe & 4 && n.Be === e.Ye && n !== e.Nn && (e.oe |= a), o && e.C & 8) {
			e.oe |= 256;
			continue;
		}
		t && r ? (e.oe |= 128, se(e, r)) : t && (e.oe |= 128, e.o && (e.o.me = void 0)), ot(e);
	}
}
function Ve(e) {
	let t = e;
	if (!t.he) {
		e._e !== h && (e.ce = e._e, e._e = h), e.C & 256 && S.ri(e);
		return;
	}
	e._e !== h && (e.ce = e._e, e._e = h, t.h &= -5, e.je && e.je !== 3 && (e.Xe = !0), e.o && (e.o.Le = !1)), t.ve = !1, t.oe &= ~r, t.o?._ ?? kt(t), t.C &= -68157441, t.h & 1 ? e.C |= f : t.h &= -5, t.o != null && (t.o._n !== null || t.o.fn !== null) && S.en(t, !1, !0), e.C & 256 && S.ri(e);
}
var He = null, Ue = [], We = [];
function Ge() {
	for (; We.length;) kt(We.pop());
	let e = Ye.Gn;
	for (let t = 0; t < e.length; t++) {
		let n = e[t];
		Ve(n), n.we = null, n.C & 131072 && (n.C &= ~l, Ue.push(n));
	}
	e.length = 0, He?.();
}
function Ke(e = null, t = !1) {
	let n = Ye, r = !t;
	r && Ge(), !t && C.ft.length && qe(C);
	let i = e?.Dn, a = r && (e ?? n).cn.length !== 0;
	if (i && !a) for (let e of i) e.oe & 64 || ot(e);
	let o = v.EE >= v.ln;
	if (o && pt(v, S.Ke), r) {
		if (Ye !== n) {
			if (e === null || e === n) return;
		} else o && Ge();
		let t = e ?? n;
		if (t.cn.length && S.oi(t.cn), i && a) {
			for (let e of i) e.oe & 64 || ot(e);
			x();
		}
		if (t.In.size) {
			for (let e of t.In) e.oe & 64 || ot(e);
			t.In.clear(), x();
		}
		if (t.A.length && (S.G(t.A), C.ft.length && qe(C)), t.ti.size && S._t(t.ti, e), Ue.length !== 0) {
			for (; Ue.length;) Be(Ue.pop());
			v.EE >= v.ln && (pt(v, S.Ke), Ge());
		}
		be(), ne.size && S.li(e);
	}
}
function qe(e, t) {
	for (let n of e.ft) t ? n.Re?.() : n.Ee?.(), qe(n, t);
}
function Je(e) {
	for (let t = 0; t < e.length; t++) e[t].we = b, e[t].C &= ~m;
}
var C = new S(), Ye = C.m;
function Xe(e) {
	if (_e > 0) return e ? e() : void 0;
	if (e) {
		he++;
		try {
			return e();
		} finally {
			try {
				Xe();
			} finally {
				he--;
			}
		}
	}
	if (!C.Jn && !pe) {
		for (; fe || b;) C.flush();
		Re = 0;
	}
}
function Ze(e, t) {
	for (let n = 0; n < e.length; n++) e[n](t);
}
function Qe(t, n, r) {
	let i = t.oe;
	if (i & 64) return !1;
	if (i & 32) {
		let e = t;
		for (; e && e.oe & 32;) e = e._parent;
		let n = e && (e.we || (e.C & 1048576 ? b : null));
		if (!n && e && e.C & 67108864 && e.o?.me && (n = re(e.o.me).we), !n || (n = tt(n)).Rn === !0 || n === r) return !1;
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
function $e(e, t, n) {
	let r = e.le.get(t), i = !1;
	for (let e of r ?? []) {
		if (Qe(e, t, n)) return !0;
		n && e.oe & 32 ? i = !0 : r.delete(e);
	}
	return i || e.le.delete(t), !1;
}
function et(e) {
	if (e.Rn) return !0;
	if (e.pe.length) return !1;
	let t = !0;
	for (let n of e.le.keys()) if ($e(e, n, e) && n.o?.ue?.size) {
		t = !1;
		break;
	}
	return t && S.ai?.(e) && (t = !1), t && (e.Rn = !0), t;
}
function tt(e) {
	for (; e.Rn && typeof e.Rn == "object";) e = e.Rn;
	return e;
}
function nt(e) {
	for (let t of ce) if ($e(t, e)) return t;
	return null;
}
function rt(e) {
	for (let t of ce) $e(t, e) && C.initTransition(t);
}
function it(e, t) {
	let n = b;
	try {
		return b = tt(e), t();
	} finally {
		b = n;
	}
}
//#endregion
//#region ../../node_modules/.bun/@solidjs+signals@2.0.0-rc.13/node_modules/@solidjs/signals/dist/prod/core/heap.js
function at(e) {
	return e.oe & 32 ? le : v;
}
function ot(e) {
	let t = at(e);
	t.ln > e.rn && (t.ln = e.rn), ct(e, t);
}
function st(e, t) {
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
function ct(e, t) {
	let n = e.oe;
	n & 1036 || (n & 1 ? e.oe = n & -4 | 10 : (e.oe = n | 8, t.tE && ft(e)), n & 16 || st(e, t));
}
function lt(e, t) {
	let n = e.oe;
	n & 1052 || (e.oe = n | 16, st(e, t));
}
function ut(e, t) {
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
function dt(e) {
	if (!e.tE) {
		e.tE = !0;
		for (let t = 0; t <= e.EE; t++) for (let n = e.eE[t]; n !== void 0; n = n.Pn) n.oe & 8 && ft(n);
	}
}
function ft(e, t = 2) {
	let n = e.oe;
	if (!((n & 3) >= t)) {
		e.oe = n & -4 | t;
		for (let t = e.u; t !== null; t = t.Ae) ft(t.ge, 1);
		if (e.C & 4096) for (let t = e.o.i; t !== null; t = t.Ue) for (let e = t.u; e !== null; e = e.Ae) ft(e.ge, 1);
	}
}
function pt(e, t) {
	for (e.tE = !1, e.ln = 0; e.ln <= e.EE; e.ln++) {
		let n = e.eE[e.ln];
		for (; n !== void 0;) n.oe & 8 ? t(n) : mt(n, e), n = e.eE[e.ln];
	}
	e.EE = 0;
}
function mt(e, t) {
	ut(e, t);
	let n = e.rn;
	for (let t = e.Ie; t; t = t.Ne) {
		let e = t.Oe, r = e.De || e;
		r.he && r.rn >= n && (n = r.rn + 1);
	}
	if (e.rn !== n) {
		e.rn = n;
		for (let t = e.u; t !== null; t = t.Ae) lt(t.ge, at(t.ge));
	}
}
//#endregion
//#region ../../node_modules/.bun/@solidjs+signals@2.0.0-rc.13/node_modules/@solidjs/signals/dist/prod/core/owner.js
function ht(e) {
	let t = e.tn;
	for (; t;) {
		let e = t.oe;
		t.oe = e | 32, e & 24 && (ut(t, e & 32 ? le : v), e & 8 ? ct(t, le) : lt(t, le)), ht(t), t = t.un;
	}
}
function gt(e, t = !1, n) {
	let r = e.oe;
	if (r & 64) return;
	if (t && !n && e.o !== null && (e.o._n !== null || e.o.fn !== null) && gt(e, !1, !0), t) {
		e.oe = r | 64;
		let t = e;
		(t.o?.Ze || t.o?.He) && S.ri(t), t.C & 2048 && t.o.Un.forEach(S.ri);
		let n = t.we;
		n && t.h & 1 && !we.includes(n) && (we.push(n), x());
	}
	t && e.he && e.o !== null && (e.o.Ce = null);
	let i = n ? e.o?._n ?? null : e.tn;
	for (n || (e.tn = null); i;) {
		let e = i;
		e.C &= -33, ut(e, at(e)), At(e), i.gn = i, gt(i, !0), i = i.un;
	}
	if (n ? e.o !== null && (e.o._n = null) : e.En = 0, t && !n && !(r & 32) && e._parent !== null && !(e._parent.oe & 64)) {
		let t = e.gn, n = e.un;
		t === null ? e._parent.tn = n : t.un = n, n !== null && (n.gn = t), e.gn = null;
	}
	if (vt(e, n), t && e.wn) {
		let t = e.wn;
		e.wn = void 0, t();
	}
}
function _t(e, t) {
	let n = e.tn;
	t.gn = null, t.un = n, n !== null && (n.gn = t), e.tn = t;
}
function vt(e, t) {
	let n = t ? e.o?.fn : e.qe;
	if (n) {
		if (t ? e.o.fn = null : e.qe = null, Array.isArray(n)) for (let e = n.length - 1; e >= 0; e--) {
			let t = n[e];
			t.call(t);
		}
		else n.call(n);
	}
}
function yt(e, t) {
	let n = e;
	for (; n.C & 4 && n._parent;) n = n._parent;
	if (n.id != null) return St(n.id, t ? n.En++ : n.En);
	throw Error("");
}
function bt(e) {
	return yt(e, !0);
}
function xt(e, t, n) {
	return e?.id ?? (t ? n?.id : n?.id == null ? void 0 : bt(n));
}
function St(e, t) {
	let n = t.toString(36), r = n.length - 1;
	return e + (r ? String.fromCharCode(64 + r) : "") + n;
}
function Ct() {
	return w;
}
function wt(e) {
	return w && (w.qe ? Array.isArray(w.qe) ? w.qe.push(e) : w.qe = [w.qe, e] : w.qe = e), e;
}
function Tt(e = !0) {
	gt(this, e);
}
function Et(e) {
	let t = w, n = e?.transparent ?? !1, r = {
		id: xt(e, n, t),
		C: n ? 4 : 0,
		Wn: !0,
		qn: t?.Wn ? t.qn : t,
		tn: null,
		un: null,
		gn: null,
		qe: null,
		T: t?.T ?? C,
		Je: t?.Je || ee,
		En: 0,
		o: null,
		_parent: t,
		dispose: Tt
	};
	return t && _t(t, r), r;
}
function Dt(e, t) {
	let n = Et(t);
	return Gn(n, () => e(() => n.dispose()));
}
//#endregion
//#region ../../node_modules/.bun/@solidjs+signals@2.0.0-rc.13/node_modules/@solidjs/signals/dist/prod/core/graph.js
function Ot(e) {
	let t = e.Oe, n = e.Ne, r = e.Ae, i = e.el;
	if (r === null ? t.mn = i : r.el = i, i !== null) i.Ae = r;
	else if (t.u = r, r === null) {
		t.C & 262144 ? pn(t) : t.o?.Hn?.();
		let e = t;
		e.he && e.C & 32 && !(e.oe & 32) && !(e.h & 1) && jt(e);
	}
	return n;
}
function kt(e) {
	let t = e.Nn, n = t === null ? e.Ie : t.Ne;
	if (n !== null) {
		do
			n = Ot(n);
		while (n !== null);
		t === null ? e.Ie = null : t.Ne = null;
	}
}
function At(e) {
	let t = e.Ie;
	if (t) {
		do
			t = Ot(t);
		while (t !== null);
		e.Ie = null, e.Nn = null;
	}
}
function jt(e) {
	ut(e, at(e)), At(e), gt(e, !0);
}
var Mt = /* @__PURE__ */ new Set();
function Nt() {
	if (Mt.size !== 0) {
		for (let e of Mt) !e.u && e.C & 32 && !(e.h & 1) && !(e.oe & 96) && jt(e);
		Mt.clear();
	}
}
function Pt(e, t, n = !1) {
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
	r === null ? t.Ie = s : r.Ne = s, o === null ? e.u = s : o.Ae = s, Le();
}
//#endregion
//#region ../../node_modules/.bun/@solidjs+signals@2.0.0-rc.13/node_modules/@solidjs/signals/dist/prod/core/async.js
function Ft(e, t) {
	return !e.o?.ue?.has(t) && ((E(e).ue ??= /* @__PURE__ */ new Set()).add(t), !0);
}
function It(e, t) {
	let n = e.o?.ue;
	return n?.delete(t) ? (n.size || (e.o.ue = void 0), !0) : !1;
}
function Lt(e) {
	e.o !== null && (e.o.ue = void 0);
}
function Rt(e, t) {
	for (let n = e.Ie; n; n = n.Ne) {
		let e = n.Oe.De || n.Oe;
		if (e === t || e.o?.ue?.has(t)) return !0;
	}
	return !1;
}
function zt(e, t) {
	E(e).Pe = !0, t.source && Ft(e, t.source), e.h & 2 || Bt(e, t.source, t);
}
function Bt(t, n, r) {
	if (!n) {
		t.o !== null && (t.o._ = null);
		return;
	}
	if (r instanceof e && r.source === n) {
		E(t)._ = r;
		return;
	}
	let i = t.o?._;
	(!(i instanceof e) || i.source !== n) && (E(t)._ = new e(n));
}
function Vt(e, t) {
	for (let n = e.u; n !== null; n = n.Ae) t(n.ge, n);
	for (let n = e.o?.i ?? null; n !== null; n = n.Ue) for (let e = n.u; e !== null; e = e.Ae) t(e.ge, e);
}
function Ht(e) {
	e.he && e.C & 32 && !e.u && !(e.oe & 32) && !(e.h & 1) && jt(e);
}
function Ut(e) {
	let t, n = /* @__PURE__ */ new Set(), r = (e) => {
		n.has(e) || (n.add(e), !e.u && e.C & 32 && (t ??= []).push(e), Vt(e, r));
	};
	if (Vt(e, r), t) for (let e of t) Ht(e);
}
function Wt(e, t) {
	let n = !1, r = /* @__PURE__ */ new Set(), i = (e) => {
		r.has(e) || (r.add(e), e.o?._ === t && (ot(e), n = !0), Vt(e, i));
	};
	Vt(e, i), n && x();
}
function Gt(e, t = e) {
	It(e, t);
	let n = !1, r, i = /* @__PURE__ */ new Set(), a = S.Ge, o = (s) => {
		if (i.has(s) || t !== e && Rt(s, t) || !It(s, t)) return;
		i.add(s), s.be = y;
		let c = s.o?.ue?.values().next().value, l = s.h & 2;
		c ? (l || Bt(s, c), a?.(s)) : (s.h &= -2, l || Bt(s), a?.(s), s.o?.Pe && (ot(s), n = !0), s.o !== null && (s.o.Pe = !1), !s.u && s.C & 32 && (r ??= []).push(s)), Vt(s, o);
	};
	if (Vt(e, o), r) for (let e of r) Ht(e);
	n && x();
}
function Kt(e) {
	return typeof e == "object" && !!e && typeof e.then == "function";
}
function qt(e) {
	let t = e.o?.ye;
	t != null && (e.o.ye = null, t());
}
function Jt(t, n, r) {
	let i = !1, a = !1;
	if (typeof n == "object" && n && gn(() => {
		i = n[Symbol.asyncIterator], a = !i && Kt(n);
	}), !a && !i) return t.o !== null && (t.o.Ce = null), t.ve = !1, n;
	E(t).Ce = n, t.o.ue = void 0;
	let o = Re, s, c = () => {
		let e = oe(t);
		if (t.o?.me && (e = nt(t) ?? e), e && t.h & 4 && !tt(e).le.has(t)) {
			t.we = null;
			return;
		}
		C.initTransition(e), rt(t);
	}, l = (r) => {
		if (t.o?.Ce !== n) return;
		let i = r instanceof e;
		if (i && t.ve) {
			t.o !== null && (t.o.Ce = null), zt(t, r), t.be = y;
			return;
		}
		c(), Zt(t, i ? 1 : 2, r), i && Gt(t), t.be = y, i || Ut(t);
	}, u = (e, i) => {
		if (t.o?.Ce !== n || t.oe & 130) return;
		ze(o), c();
		let a = !!(t.h & 4), s = t.o?.Le;
		Xt(t), s && (t.o.Le = !0);
		let u = ae(t);
		if (u && u.Qe.delete(t), r) {
			try {
				r(e);
			} catch (e) {
				l(e);
				return;
			}
			a && Xt(t, !0);
		} else if (t.o?.Fe !== void 0 && !(u && t.C & 8388608)) t._e === h && Pe(t), t._e = e, S.Ve?.(t, e), jn(t) ? S.ke(t, e) : Be(t), t.be = y;
		else if (u) {
			let n = t.je, r = jn(t) ? _(t.o.Fe) : t.ce, i = t.xe;
			try {
				(!n && a || !i || !i(r, e)) && (n ? t.ce = e : S.Me(t, e, u), t.be = y, S.Ve?.(t, e), Be(t, !0));
			} catch (e) {
				Zt(t, 2, e);
			}
		} else try {
			Bn(t, () => e);
		} catch (e) {
			Zt(t, 2, e);
		}
		t._e === h && (t.ve = !1, s && (t.o.Le = !1), kt(t)), Gt(t), x(), Xe(), i?.();
	}, d = () => t.C & 32 && !t.u && !(t.h & 1) ? (jt(t), !0) : !1, f = (e, r) => {
		let i = e[Symbol.asyncIterator](), a = !1, o = !1, c = !r, f = () => {
			if (!o) {
				o = !0;
				try {
					let e = i.return?.();
					Kt(e) && e.then(void 0, () => {});
				} catch {}
			}
		};
		r ? r(f) : wt(f), E(t).ye = f;
		let p = () => {
			d() || m();
		}, m = () => {
			let e, r, f = !1, h = !1, g = !0, _ = i.next();
			if ((Kt(_) ? _ : { then: (e) => void e(_) }).then((r) => {
				if (g && c) e = r, f = !0, r.done && (o = !0);
				else if (t.o?.Ce !== n) return;
				else r.done ? (o = !0, a ? (x(), Xe()) : u(void 0), d()) : (a = !0, u(r.value, p));
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
		if (typeof e == "object" && e && gn(() => {
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
			throw C.initTransition(oe(t)), new e(w);
		}
	}
	if (i && m(n), p !== null) {
		if (!p) {
			if (t.ve) return t.ce;
			throw C.initTransition(oe(t)), new e(w);
		}
		t.ve = !1;
	}
	return s;
}
function Yt(e, t = !1) {
	e.o?.ue && Lt(e), e.o?.Pe && e.o !== null && (e.o.Pe = !1), e.o !== null && (e.o.Le = !1), e.h = t ? 0 : e.h & 4, e.o?._ && Bt(e), (e.o?.Ze || e.o?.He) && S.Ge(e), e.o?.i && e.C & 2048 && S.We !== null && S.We(e);
	let n = ln(e);
	n && n.call(e);
}
function Xt(e, t = !1) {
	let n = e.o?.ue;
	n && (n.delete(e), n.size) ? (e.o.Pe = !1, t && (e.h = 1), Bt(e, n.values().next().value)) : Yt(e, t);
}
function Zt(n, r, i, a, o) {
	r === 2 && !(i instanceof t) && !(i instanceof e) && (i = new t(n, i));
	let s = r === 1 && i instanceof e ? i.source : void 0, c = s === n, l = r === 1 && n.o?.Fe !== void 0 && !(n.C & 8388608) && !c, u = l && jn(n);
	a || (o && se(n, o), r === 1 && s ? (Ft(n, s), n.h & 1 || (n.C &= ~f), n.h = 1 | n.h & 4, Bt(n, s, i)) : (Lt(n), n.h = r | (r === 2 ? 0 : n.h & 4), E(n)._ = i), S.Ge?.(n), n.o?.i && n.C & 2048 && S.We !== null && S.We(n));
	let d = a || u, p = a || l ? void 0 : o, m = ln(n);
	if (m) {
		if (a && r === 1) return;
		d ? m.call(n, r, i) : m.call(n);
		return;
	}
	Vt(n, (t, n) => {
		if (t.be = y, r === 1 && n.Be !== t.Ye) {
			ot(t), x();
			return;
		}
		if (r === 1 && s && !t.o?.ue?.has(s) || r !== 1 && (t.o?._ !== i || t.o?.ue)) {
			if (n.ze && r !== 1 && !(i instanceof e)) {
				ot(t), x();
				return;
			}
			d || (t.we ? s && !t.je && (t.h & 1 || t._e !== h) && C.initTransition(t.we) : Pe(t)), Zt(t, r, i, d, p);
		}
	});
}
S.Ke = (e) => {
	e.je === 3 ? (ut(e, at(e)), e.Xe = !0, e.T.enqueue(2, e.$e)) : nn(e);
}, S.en = gt;
var Qt = !1, $t = !1, en = !1, tn = !1, w = null, T = null;
function nn(t, n = !1) {
	Le();
	let r = t.je, o = !!(t.oe & 128), s = null;
	if (o ? (s = S.an(t, !0), s === !1 && (o = !1)) : t.C & 8388608 ? (s = S.an(t, !0), s && (o = !0)) : b && !n && b.cn.length && (s = S.an(t, !1), s && (o = !0)), !n) {
		if (t.we && !r && b !== t.we && C.initTransition(t.we), ut(t, at(t)), t.o !== null && (t.o.Ce = null, qt(t)), r === 3 || t.C & 68157440) gt(t);
		else if (t.tn !== null || t.qe !== null) {
			ht(t);
			let e = E(t);
			e.fn = t.qe, e._n = t.tn, t.qe = null, t.tn = null, t.En = 0, s && (t.C |= d, re(s).dn[0].push(() => {
				t.C &= ~d, gt(t, !1, !0);
			}));
		}
	}
	let c = !!(t.C & 8388736) && t.o?.Fe !== h && t.o?.Fe !== void 0, l = !!(t.h & 4), f = t.h & 2 ? t.o?._ : void 0, p = !!(t.h & 1), m = p ? t.o?.ue : void 0, g = t.o?.ue?.has(t), ee = (t.oe & i) !== 0, te = t.ve, ne = xn;
	xn = null;
	let ie = w;
	w = t, t.Nn = null, t.Ye++, t.oe = 4 | t.oe & 32, t.be = y;
	let ae = t._e === h ? t.ce : t._e, oe = t.rn, se = !1, ce = Qt, v = T;
	Qt = !0;
	let le = tn;
	tn = !1, r || (T = null), s && (T = s);
	let ue = r && r !== 2, de = $t;
	ue && ($t = !0), r && b !== null && b.In.size && b.In.delete(t);
	try {
		if (t.C & 64) ae = t.he(ae), t.o !== null && (t.o.Ce = null), t.ve = !1;
		else {
			let e = t.o?.Ce, n = t.he(ae), r = typeof n == "object" && !!n, i = t.o?.Ce !== e;
			ae = i || !r ? n : Jt(t, n), !i && !r && (t.o !== null && (t.o.Ce = null), t.ve = !1);
		}
		(t.h !== 0 || t.o !== null) && Yt(t, n && xn === null), t.C & 1024 && t.o?.me && S.Tn(t);
	} catch (n) {
		let r = n instanceof e;
		if (r && t.ve) zt(t, n);
		else {
			r && T && S.Sn(t);
			let e = !1;
			if (r && (E(t).Pe = !0, S.On !== null && (e = S.On(t, ee))), Zt(t, r ? 1 : 2, n, void 0, r ? t.o?.me : void 0), r && g && !t.o?.Ce && Gt(t), r && m) for (let e of m) e !== t && !t.o?.ue?.has(e) && Gt(t, e);
			e && S.k(t);
		}
	} finally {
		Qt = ce, tn = le, ue && ($t = de), se = (t.oe & a) !== 0, t.oe = t.oe & 96 | (n ? t.oe & 256 : 0), w = ie;
	}
	let fe = xn;
	if (xn = ne, t.oe & 64) {
		At(t), t.o !== null && (t.o.Ce = null), T = v;
		return;
	}
	if (!t.o?._) {
		let i = c ? _(t.o?.Fe) : o || t._e === h ? t.ce : t._e, a = !1;
		try {
			a = !r && l || !t.xe || !t.xe(i, ae);
		} catch (e) {
			Zt(t, 2, e);
		}
		if (r && a && (t.Xe = !t.o?._, !n)) {
			t.T.enqueue(r, t.An ??= S.Cn.bind(null, t));
			let e = t.pn;
			e !== b && (t.pn = b, e !== null && (e = tt(e)) !== b && !e.Rn && ((e.Dn ??= []).push(t), b !== null && (b.Dn ??= []).push(t)));
		}
		if (!t.o?._) {
			if (a) {
				let i = c ? t.o?.Fe : void 0;
				n && fe === null || r && fe === null && (b !== t.we || b === null || t.C & 32768) || o ? (o && !r && T !== null ? S.Me(t, ae, T) : t.ce = ae, o && (t._e = h)) : (t._e = ae, fe !== null && (t.we !== fe && (t.we = fe, fe.Gn.push(t)), r && fe.In.add(t), Sn(t) && t.T.notify(t, 1, 1, new e(t))), te && (t.ve = !0), t.C & 256 && S.Ve !== null && S.Ve(t, ae)), t.u !== null && (!c || o || t.o?.Fe !== i) ? Be(t, o || c) : c && !o && t.o.hn !== y && S.ke(t, ae);
			} else if (c) t._e === h && Pe(t), t._e = ae, te && (t.ve = !0), S.ke(t, ae);
			else if (t.rn != oe) for (let e = t.u; e !== null; e = e.Ae) lt(e.ge, at(e.ge));
		}
		if (!a && !t.o?._ && (f !== void 0 && Wt(t, f), m)) for (let e of m) e !== t && Gt(t, e);
		g && !(t.h & 5) && (Gt(t), Te());
	}
	let pe = t.Nn;
	r && (p && !(t.h & 1) || (pe === null ? t.Ie !== null : pe.Ne !== null)) && Te(), !t.o?._ && t._e === h && !(r && t.Xe) && (n || o || r === 3 ? kt(t) : (t.Nn?.Ne ?? t.Ie) && We.push(t)), T = v;
	let me = (t.C & d) !== 0, he = (t._e !== h || !me && t.o !== null && (t.o._n !== null || t.o.fn !== null) || !!(t.h & 5)) && (!n || fe !== null || !!(t.h & 1));
	if (he && (!t.we || c) ? Pe(t) : he && (b === null || o) && !(t.h & 5) && (he = !1, me || gt(t, !1, !0)), he ? t.C |= u : t.C &= ~u, t.we && r && b !== t.we && fe === null) {
		let e = t.pn;
		it(t.we, () => nn(t)), t.pn = e;
	}
	se && (ot(t), x());
}
function rn(e) {
	if (!(e.oe & 68)) {
		if (e.oe & 1) for (let t = e.Ie; t; t = t.Ne) {
			let n = t.Oe, r = n.De || n;
			if (r.he && rn(r), e.oe & 2) break;
		}
		(e.oe & 130 || e.o?._ && e.be < y && !e.o?.Ce) && nn(e), e.oe &= 376 | r;
	}
}
function an(e, t) {
	let n = t?.transparent ?? !1, r = typeof t == "object" && !!t && "loadingValue" in t, i = {
		id: xt(t, n, w),
		C: (n ? 4 : 0) | !!t?.ownedWrite | (!w || t?.lazy ? 32 : 0) | (t?.sync ? 64 : 0) | (t?.H ? 2 : 0) | 0,
		xe: t?.equals ?? hn,
		qe: null,
		T: w?.T ?? C,
		Je: w?.Je ?? ee,
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
		_parent: w,
		un: null,
		gn: null,
		tn: null,
		oe: t?.lazy ? 512 : 0,
		h: r ? 0 : 4,
		be: y,
		_e: h,
		we: null,
		vn: -1,
		ve: r,
		o: null
	};
	return t?.unobserved && (E(i).Hn = t.unobserved), dn(i, t), i;
}
function E(e) {
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
function on(e, t, n, r, i) {
	let a = i?.transparent ?? !1, o = {
		id: xt(i, a, w),
		C: (a ? 4 : 0) | !!i?.ownedWrite | (i?.sync ? 64 : 0) | (i?.yn ?? 0) | 0,
		xe: !1,
		qe: null,
		T: w?.T ?? C,
		Je: w?.Je ?? ee,
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
		_parent: w,
		un: null,
		gn: null,
		tn: null,
		oe: 512,
		h: 4,
		be: y,
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
	return i?.unobserved && (E(o).Hn = i.unobserved), dn(o, un), o;
}
var sn = null;
function cn(e) {
	sn = e;
}
function ln(e) {
	let t = e.o?.S;
	return t === void 0 ? e.je ? sn ?? void 0 : void 0 : t;
}
var un = { lazy: !0 };
function dn(e, t) {
	e.Fn = e;
	let n = w?.Wn ? w.qn : w;
	w && _t(w, e), n && (e.rn = n.rn + 1), S.Zn !== null && S.Zn(e), !t?.lazy && nn(e, !0);
}
function fn(e, t, n = null) {
	let r = {
		xe: t?.equals ?? hn,
		C: +!!t?.ownedWrite | (t?.H ? 2 : 0),
		ce: e,
		u: null,
		mn: null,
		be: y,
		De: n,
		Ue: n?.o?.i || null,
		Yn: null,
		_e: h,
		we: null,
		vn: -1,
		o: null
	};
	return t?.unobserved && (E(r).Hn = t.unobserved), n && mn(n, r), r;
}
var pn;
function mn(e, t) {
	let n = t.Ue;
	n !== null && (n.Yn = t), E(e).i = t, e.C |= s;
}
function hn(e, t) {
	return e === t;
}
function gn(e, t) {
	if (S.jn === null && !Qt) return e();
	let n = Qt;
	Qt = !1;
	try {
		return S.jn === null ? e() : S.jn(e);
	} finally {
		Qt = n;
	}
}
function _n(e, t) {
	if (e.oe & 512) e.oe &= -513, nn(e, !0);
	else if (e.oe & 64) {
		if (e.C & 32) {
			let t = e._parent;
			if (t !== null) {
				if (t.oe & 64) {
					e.C &= -33;
					return;
				}
				e.oe & 32 || _t(t, e);
			}
			nn(e, !0);
		}
	} else t && rn(e);
}
function vn(e, t) {
	let n = t.pn;
	(n == null || tt(n) !== e) && e.In.add(t);
}
function yn(e) {
	return b !== null && tt(e) === tt(b);
}
function bn(e, t) {
	let n = e.we;
	if (n === null || yn(n)) return !1;
	let r = tt(n);
	vn(r, t);
	let i = r.le.get(e);
	return i ? i.add(t) : e.h & 1 && it(r, () => t.T.notify(t, 1, 1, e.o._)), !0;
}
var xn = null;
function Sn(e) {
	for (let t = e.T; t !== null; t = t._parent) if (t.te & 1) return !t.q;
	return !1;
}
function Cn(e, t = e.we) {
	if (!t || t === b || e?.o?.kn || w?.o?.kn) return;
	let n = w, r = b === null && !C.Jn;
	if (!(r && S.Xn)) {
		if (n.oe & 4 && !(n.C & 128) && (xn === null || xn === t) && (r || !S.Xn && Sn(n))) {
			xn = t;
			return;
		}
		C.initTransition(t);
	}
}
function wn(e, t, n, r) {
	return !!(!t || T !== null && S.$n(e, n, t) || e._e === h || t.C & 16 || $t && !r && bn(e, t) || e.C & 131072 && T !== null && !tn && !(t.C & 8192));
}
var Tn = !1;
function En() {
	Tn = !0;
}
function Dn(e, t = e.ce) {
	return C.Jn || e._e === h || e.C & 4194304 || e.o?.kn ? h : e.we === null || e.C & 16777216 ? t : e.o === null ? h : e.o.bn;
}
var On = [], kn = [];
function An(e) {
	return !C.Jn && e.o?.hn === y && !e.o?.kn;
}
function jn(e) {
	let t = e.o;
	return t !== null && t.Fe !== void 0 && t.Fe !== h;
}
function Mn(e) {
	return jn(e) && !An(e);
}
function Nn(e) {
	return e.oe |= a, !0;
}
var Pn = [];
function Fn() {
	if (Tn = !1, On.length !== 0) {
		for (let e of On) e.o.bn = h;
		On.length = 0;
	}
	if (kn.length !== 0) {
		for (let e of kn) e.C &= ~p;
		kn.length = 0;
	}
	if (Pn.length !== 0) {
		for (let e of Pn) S.Ve(e, e._e === h ? e.ce : e._e);
		Pn.length = 0;
	}
}
function In(e) {
	if (tn) return S.et(e);
	let t = w;
	t?.Wn && (t = t.qn);
	let n = e, r = e.De || e;
	if (typeof n.he == "function" && _n(e, !1), !n.he && r === e && e.o?.Fe === void 0 && e.o?.sn === void 0 && b === null && T === null && (!Tn || e._e === h)) return t && Qt && Pt(e, t), !t || e._e === h || t.C & 16 || $t && bn(e, t) ? e.ce : (Cn(e), e._e);
	if (t && Qt && (Pt(e, t, en), r.he)) {
		let n = at(e);
		r.rn >= n.ln ? (ft(t), dt(n), rn(r)) : t.C & 65536 && rn(r);
		let i = r.rn;
		i >= t.rn && e._parent !== t && (t.rn = i + 1);
	}
	if (r.h & 1) {
		if (t && (!$t || r.h & 4 || r.C & 2097152 || r.C & 1024 && S.tt(r) || !bn(r, t))) {
			if (T === null || S.it(r)) throw !Qt && e !== t && Pt(e, t), r.o?._;
		} else if (!t && r.h & 4 && !(jn(e) && e.C & 8388608)) throw r.o?._;
	}
	if (r.he && r.h & 2) {
		if (Qt && r.be < y) return nn(r), In(e);
		throw r.o?._;
	}
	let i = Ln(e, t, r, e.ce);
	return !t && r === e && typeof n.he == "function" && e.C & 32 && !(r.h & 1) && !e.u && !Mn(e) && (Mt.add(e), x()), i;
}
function Ln(t, n, r, i) {
	if (jn(t)) {
		if (!(n && n.C & 8192) && !An(t)) return n && t.C & 525312 ? S.ut(t, n) : _(t.o?.Fe);
		t.C |= c;
	}
	if (T !== null && b !== null && n !== null && S.lt(t, r, n)) return i;
	let a = t._e !== h && !!(t.h & 4);
	if (a && !n) throw new e(null);
	let o = n && Tn ? Dn(t, i) : h;
	return o === h ? wn(t, n, r, a) ? i : (Cn(t), t._e) : (Nn(n), o);
}
function Rn(e) {
	if (C.Jn) return;
	let t = E(e);
	t.bn === h && (t.bn = e._e, On.push(e), Tn = !0);
}
function zn(e) {
	C.Jn || e.C & 4194304 || (e.C |= p, kn.push(e));
}
function Bn(e, t) {
	if (e.we && b !== e.we && (C.Jn ? C.initTransition(e.we) : (Oe.push(e.we), x())), e.C & 128) return S.ot(e, t);
	let n = e._e === h ? e.ce : e._e;
	if (typeof t == "function" && (t = t(n)), !(e.h & 4 || !e.xe || !e.xe(n, t))) return t;
	let r = e._e !== h;
	return r ? e.we !== null && Rn(e) : Pe(e), e._e = t, w !== null && zn(e), e.C & 256 && S.Ve !== null && (S.Ve(e, t), C.Jn || Pn.push(e)), e.he !== void 0 && (e.be = y), r && e.vn === Ie && T === null ? t : (Be(e), x(), t);
}
function Vn(e) {
	ut(e, at(e)), !(e.oe & 1024) && e._e === h && (Pe(e), x()), e.oe = e.oe & -4 | r, e.ct = y;
}
function Hn(e) {
	return e.we !== null && b !== e.we && !((e.De || e).oe & 1024);
}
function Un(e) {
	e.oe |= 2, ot(e);
}
function Wn(e, t) {
	let n = Hn(e);
	n && typeof t == "function" && (t = t(e.ce));
	let r = Bn(e, t);
	return n ? Un(e) : Vn(e), r;
}
function Gn(e, t) {
	let n = w, r = Qt;
	w = e, Qt = !1;
	try {
		return t();
	} finally {
		w = n, Qt = r;
	}
}
function Kn(e, t = !0) {
	let n = $t;
	$t = t;
	try {
		return e();
	} finally {
		$t = n;
	}
}
//#endregion
//#region ../../node_modules/.bun/@solidjs+signals@2.0.0-rc.13/node_modules/@solidjs/signals/dist/prod/core/effect.js
function qn(e, t, n, r) {
	let i = on(e, t, n, r?.user ? 2 : 1, r);
	nn(i, !0), !r?.defer && i._e === h && (i.je === 2 || r?.schedule ? i.T.enqueue(i.je, Yn.bind(null, i)) : Yn(i, 4));
}
function Jn(e, t) {
	let r = e === void 0 ? this.h : e, i = t === void 0 ? this.o?._ : t;
	if (r & 2) {
		if (this.T.notify(this, 1, 0), this.je === 2) {
			this.h & 2 && (this.Xe = !0, this.T.enqueue(this.je, this.An ??= Yn.bind(null, this)));
			return;
		}
		if (!this.T.notify(this, 2, 2)) throw Ae(n(i)), i;
	} else this.je === 1 && this.T.notify(this, 3, r, i);
}
function Yn(e, r) {
	if (!e.Xe || e.oe & 64) return;
	if (e.pn !== null && !tt(e.pn).Rn && (r & 4 ? !e.o?.me : b !== null)) {
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
			if (!e.T.notify(e, 2, 2)) throw Ae(t), t;
		}
		return;
	}
	let i = e.o?._ == null, a = e.wn;
	e.wn = void 0;
	try {
		a?.(), e.wn = e.Qn(e.ce, e.xn);
	} catch (n) {
		if (E(e)._ = new t(e, n), e.h |= 2, !e.T.notify(e, 2, 2)) throw Ae(n), n;
	} finally {
		e.xn = e.ce, e.Xe = !1, i && kt(e);
	}
}
S.Cn = Yn;
function Xn(e, t) {
	let n = () => {
		if (!(!r.Xe || r.oe & 64)) try {
			r.Xe = !1, nn(r);
		} finally {}
	}, r = an(() => {
		let t = r.wn;
		r.wn = void 0, t?.();
		let n = Kn(e);
		r.wn = n;
	}, {
		...t,
		lazy: !0
	});
	r.wn = void 0, r.C = r.C & -33 | 16, r.Xe = !0, r.je = 3, r.$e = n, ot(r), x();
}
cn(Jn);
//#endregion
//#region ../../node_modules/.bun/@solidjs+signals@2.0.0-rc.13/node_modules/@solidjs/signals/dist/prod/signals.js
function Zn(e) {
	return wt(e);
}
function Qn(e) {
	let t = In.bind(null, e);
	return t[te] = e, t;
}
function $n(e, t) {
	if (typeof e == "function") {
		let n = an(e, t);
		return n.C &= -33, [Qn(n), Wn.bind(null, n)];
	}
	let n = fn(e, t);
	return [Qn(n), Bn.bind(null, n)];
}
function er(e, t) {
	return Qn(an(e, t));
}
function tr(e, t, n) {
	qn(e, t, void 0, n);
}
function nr(e) {
	let t = Ct();
	t && !(t.C & 16) ? Xn(() => gn(e), void 0) : C.enqueue(2, function t() {
		if (v.EE >= v.ln) return C.enqueue(2, t);
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
		ie: Et(),
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
	}, s = an(ur.bind(o), void 0);
	return o.ie.qn = s, s.C &= -33, Qn(s);
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
	return e[rr], Gn(this.ie, () => {
		let n, r, i, a, o = this.jt ? this.gt ? () => (i[r] = fn(e[r], sr), this.At(Qn(i[r]), r)) : () => (i[r] = fn(e[r], sr), a && (a[r] = fn(r, sr)), this.At(Qn(i[r]), a ? Qn(a[r]) : void 0)) : this.kt ? () => {
			let t = e[r];
			return a[r] = fn(r, sr), this.At(t, Qn(a[r]));
		} : () => {
			let t = e[r];
			return this.At(t);
		};
		if (t === 0) this.wt !== 0 && (this.ie.dispose(!1), this.St = [], this.yt = [], this.Mt = [], this.wt = 0, this.jt &&= [], this.kt &&= []), this.bt && !this.Mt[0] && (this.St[0]?.dispose(), this.Mt[0] = Gn(this.St[0] = Et(), this.bt));
		else if (this.wt === 0) {
			let s = Array(t), c = Array(t);
			i = this.jt && Array(t), a = this.kt && Array(t);
			try {
				for (r = 0; r < t; r++) s[r] = Gn(c[r] = Et(), o);
			} catch (e) {
				for (n = 0; n <= r; n++) c[n]?.dispose();
				throw e;
			}
			this.St[0] && this.St[0].dispose(), this.Mt = s, this.St = c, i && (this.jt = i), a && (this.kt = a), this.yt = e.slice(0), this.wt = t;
		} else {
			let s, c, l, u, d, f, p, m, h, g = (this.Wt = T !== null || this.Wt && ne.size !== 0) ? S.st : Bn;
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
			let _ = t - this.wt, ee = Array(t), te = Array(t);
			for (i = this.jt ? Array(t) : void 0, a = this.kt ? Array(t) : void 0, f = /* @__PURE__ */ new Map(), p = Array(l + 1), r = l; r >= s; r--) u = e[r], d = this.Kn ? this.Kn(u) : u, n = f.get(d), p[r] = n === void 0 ? -1 : n, f.set(d, r);
			for (n = s; n <= c; n++) u = this.yt[n], d = this.Kn ? this.Kn(u) : u, r = f.get(d), r !== void 0 && r !== -1 ? (ee[r] = this.Mt[n], te[r] = this.St[n], i && (i[r] = this.jt[n]), a && (a[r] = this.kt[n]), r = p[r], f.set(d, r)) : (m ??= []).push(this.St[n]);
			try {
				for (r = s; r <= l; r++) te[r] === void 0 && ((h ??= []).push(te[r] = Et()), ee[r] = Gn(te[r], o));
			} catch (e) {
				if (h) for (n = 0; n < h.length; n++) h[n].dispose();
				throw e;
			}
			for (n = 0; n < s; n++) ee[n] = this.Mt[n], te[n] = this.St[n], i && (i[n] = this.jt[n]), a && (a[n] = this.kt[n]);
			for (r = s; r <= l; r++) i && g(i[r], e[r]), a && g(a[r], r);
			for (r = l + 1; r < t; r++) ee[r] = this.Mt[r - _], te[r] = this.St[r - _], i && (i[r] = this.jt[r - _], g(i[r], e[r])), a && (a[r] = this.kt[r - _], _ !== 0 && g(a[r], r));
			if (this.Mt = ee, this.St = te, i && (this.jt = i), a && (this.kt = a), this.wt = t, this.yt = e.slice(0), m) for (n = 0; n < m.length; n++) m[n].dispose();
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
}, Er = (...e) => er(...e), Dr = (...e) => $n(...e), Or = (...e) => Dt(...e), kr = (...e) => tr(...e);
function D(e, t, n) {
	return gn(() => e(t || {}));
}
var Ar = (e) => `Stale read from <${e}>.`;
function jr(e) {
	let t = "fallback" in e ? {
		keyed: e.keyed,
		fallback: () => e.fallback
	} : { keyed: e.keyed }, n = Ct(), r, i = () => Gn(n, () => or(() => e.each, e.children, t));
	return Tr.hydrating && (r = i()), () => (r ??= i())();
}
function Mr(e) {
	let t = e.keyed, n = er(() => e.when, void 0), r = t ? n : er(n, {
		equals: (e, t) => !e == !t,
		sync: !0
	});
	return er(() => {
		let i = r();
		if (i) {
			let a = e.children;
			return typeof a == "function" && a.length > 0 ? gn(t ? () => a(i) : () => a(() => {
				if (!gn(r)) throw Ar("Show");
				return n();
			}), wr) : a;
		}
		return e.fallback;
	}, { sync: !0 });
}
//#endregion
//#region ../../node_modules/.bun/solid-js@2.0.0-rc.13/node_modules/solid-js/dist/internal.js
var Nr = Tr, Pr = /*#__PURE__*/ Symbol("slot"), Fr = /*#__PURE__*/ Symbol("host"), Ir = {
	transparent: !0,
	sync: !0
}, Lr = { sync: !0 };
function O(e, t, n) {
	kr(e, t, n ? {
		sync: !0,
		...n,
		transparent: !n.scope
	} : Ir);
}
function Rr(e) {
	return Er(() => e(), Lr);
}
function zr(e, t, n, r) {
	let i = n.length, a = t.length, o = i, s = 0, c = 0, l = t[a - 1], u = l[Pr], d = l.parentNode === e && (!u || u === r) ? l.nextSibling : r || null, f = null, p, m, h = (t) => {
		if (!t) return !1;
		let n = t[Pr];
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
					let i = n[c - 1], a = i[Pr];
					t = i.parentNode === e && (!a || a === r) ? i.nextSibling : d;
				} else t = n[o - c];
			} else t = d;
			for (; c < o;) {
				let i = n[c++];
				e.insertBefore(i, t), r && (i[Pr] = r);
			}
		} else if (o === c) for (; s < a;) {
			let n = t[s++];
			if (!f || !f.has(n)) {
				let t = n[Pr];
				n.parentNode === e && (!t || t === r) && n.remove();
			}
		}
		else if ((p = t[s]) === n[o - 1] && n[c] === t[a - 1] && p.parentNode === e && (!(m = p[Pr]) || m === r)) {
			if (r) do {
				let n = t[--a];
				if (e.insertBefore(n, p), n[Pr] = r, c++, s >= a - 1 || c >= o) break;
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
						let a = t[s], o = a[Pr], l = a.parentNode === e && (!o || o === r) ? a : d;
						for (; c < i;) {
							let t = n[c++];
							e.insertBefore(t, l), r && (t[Pr] = r);
						}
					} else {
						let i = t[s++], a = n[c++], o = i[Pr];
						i.parentNode === e && (!o || o === r) ? e.replaceChild(a, i) : e.insertBefore(a, d), r && (a[Pr] = r);
					}
				} else s++;
			} else {
				let n = t[s++], i = n[Pr];
				n.parentNode === e && (!i || i === r) && n.remove();
			}
		}
	}
}
var Br = "_$$", Vr = "_$SOLID_EVENT_OWNER", Hr = {}, Ur = /* @__PURE__ */ new Set(), Wr = /* @__PURE__ */ new Map();
function Gr(e, t, n, r = {}) {
	let i;
	Jr(t);
	try {
		Or((a) => {
			if (i = a, r.onError && (Ct()[ke] = r.onError), t === document) {
				let t = e();
				O(() => fr(t), () => {});
			} else {
				let i = e();
				M(t, () => i, t.firstChild ? null : void 0, n, {
					...r.insertOptions,
					schedule: !0
				});
			}
		}, { id: r.renderId }), Xe();
	} catch (e) {
		throw i && i(), Yr(t), e;
	}
	return () => {
		i(), Yr(t), t.textContent = "";
	};
}
function Kr(e, t, n) {
	let r = document.createElement("template");
	return r.innerHTML = e, n === 2 ? r.content.firstChild.firstChild : r.content.firstChild;
}
function k(e, t) {
	let n;
	return t === 1 ? (r) => document.importNode(n ||= Kr(e, r, t), !0) : (r) => (n ||= Kr(e, r, t)).cloneNode(!0);
}
function qr(e) {
	for (let t = 0, n = e.length; t < n; t++) {
		let n = e[t];
		Ur.has(n) || (Ur.add(n), Wr.forEach((e, t) => Qr(n, t, e)));
	}
}
function Jr(e) {
	let t = Xr(e, e);
	t && (t.roots = (t.roots || 0) + 1);
}
function Yr(e) {
	let t = Wr.get(e);
	t && (t.roots > 1 ? t.roots-- : delete t.roots), Zr(e, e);
}
function Xr(e, t = e) {
	if (!e || !t) return;
	let n = Wr.get(e);
	return n || Wr.set(e, n = {
		owners: /* @__PURE__ */ new Map(),
		handlers: /* @__PURE__ */ new Map()
	}), n.owners.set(t, (n.owners.get(t) || 0) + 1), Ur.forEach((t) => Qr(t, e, n)), n;
}
function Zr(e, t = e) {
	let n = Wr.get(e);
	if (!n) return;
	let r = n.owners.get(t);
	r > 1 ? n.owners.set(t, r - 1) : n.owners.delete(t), !n.owners.size && (n.handlers.forEach((t, n) => e.removeEventListener(n, t)), Wr.delete(e));
}
function Qr(e, t, n) {
	if (n.handlers.has(e)) return;
	let r = (e) => li(e, t, n);
	n.handlers.set(e, r), t.addEventListener(e, r);
}
function $r(e, t) {
	let n = e, r = 0;
	for (; n;) {
		if (t.owners.has(n)) return {
			owner: n,
			distance: r
		};
		r++, n = n._$host || n.parentNode || n.host;
	}
}
var ei = null;
function ti(e) {
	if (ei !== null) for (let t = 0; t < ei.length; t++) ei[t](e);
	return e;
}
function ni(e, t, n) {
	if (oi(e)) return;
	let r = t === "multiple" && e.localName === "select";
	if (n == null || n === !1) e.removeAttribute(t);
	else if (e.setAttribute(t, n === !0 ? "" : n), r && !e._$multiple) {
		let t = e.options;
		for (let e = 0; e < t.length; e++) t[e].defaultSelected && (t[e].selected = !0);
	}
	r && (e._$multiple = !0), ei !== null && (t === "href" || t === "action") && ti(e);
}
function A(e, t, n) {
	if (typeof t == "number" && (t = "" + t), typeof n == "number" && (n = "" + n), oi(e)) {
		e._$classes = t && typeof t == "object" ? si(t) : void 0;
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
	typeof n == "string" ? (r = {}, e.removeAttribute("class")) : r = e._$classes || si(n || {}), t = si(t);
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
function j(e) {
	if (typeof e != "object" || !e) return e;
	if (Array.isArray(e)) return e.map(j);
	if (e[ir] !== e) return e;
	let t = yr(e, 2), n = {};
	for (let r = 0; r < t.length; r++) {
		let i = t[r];
		typeof i == "string" && (n[i] = e[i]);
	}
	return n;
}
function ri(e, t, n) {
	oi(e) || (n == null ? e.style.removeProperty(t) : e.style.setProperty(t, n));
}
var ii = { scope: !0 }, ai = null;
function M(e, t, n, r, i) {
	let a = n !== void 0, o = i && i.host;
	if (a && !r && (r = []), ai !== null && (r = ai.claimInitial(e, a, r)), typeof t != "function" && (t = di(t, r, a, !0), typeof t != "function")) {
		ui(e, t, r, n), o && fi(t, o);
		return;
	}
	if (a && r.length === 0) {
		let t = document.createTextNode("");
		e.insertBefore(t, n), r = [t];
	}
	let s = r;
	O((r) => {
		ai !== null && (s = ai.reclaimRegion(s, e, n));
		let c = di(t(), s, a, !0);
		return typeof c == "function" ? (O(() => (ai !== null && (s = ai.reclaimRegion(s, e, n)), di(c, s, a)), (t) => {
			s = ui(e, t, s, n), o && fi(s, o);
		}, r !== void 0 && !(i && i.schedule) ? {
			...i,
			schedule: !0
		} : i), Hr) : c;
	}, (t) => {
		t !== Hr && (s = ui(e, t, s, n), o && fi(s, o));
	}, t.$s ? i ? {
		...i,
		scope: !0
	} : ii : i);
}
function oi(e) {
	if (!Nr.hydrating || Nr.isClaiming && !Nr.isClaiming()) return !1;
	if (!e || e.isConnected) return !0;
	let t = Nr.claimRoots;
	if (t) {
		for (let n = 0; n < t.length; n++) if (t[n].contains(e)) return !0;
	}
	return !1;
}
function si(e) {
	if (Array.isArray(e)) {
		let t = {};
		ci(e, t), e = t;
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
function ci(e, t) {
	for (let n = 0, r = e.length; n < r; n++) {
		let r = e[n];
		Array.isArray(r) ? ci(r, t) : typeof r == "object" && r ? Object.assign(t, r) : typeof r != "boolean" && (r || r === 0) && (t[r] = !0);
	}
}
function li(e, t, n) {
	if (ai !== null && ai.dedupEvent(e)) return;
	let r = e[Vr], i;
	if (r) {
		if (r === !0 || r === t || !t.contains(r)) return;
		i = r;
	}
	let a = n && (n.owners.size === 1 && n.owners.has(t) ? t : $r(e.target, n)?.owner);
	if (n && !a || a && a === i) return;
	e[Vr] = a || !0;
	let o = i || e.target, s = Br + e.type, c = e.target, l = a || t || e.currentTarget, u = (t) => Object.defineProperty(e, "target", {
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
function ui(e, t, n, r) {
	if (ai !== null && oi(e)) {
		if (t && t !== n) {
			let e = Array.isArray(t);
			for (let r of e ? t : [t]) if (r && r.nodeType) {
				if (!oi(r)) return n;
			} else if (e && (typeof r == "string" || typeof r == "number")) return n;
		}
		return t;
	}
	if (t === n) return t;
	let i = typeof t, a = r !== void 0;
	if (i === "string" || i === "number") {
		let r = typeof n;
		r === "string" || r === "number" ? e.firstChild.data = t : mi(e, n) ? e.textContent = t : (hi(e, n), e.insertBefore(document.createTextNode(t), e.firstChild));
	} else if (t === void 0) gi(e, n, r);
	else if (t.nodeType) Array.isArray(n) ? gi(e, n, a ? r : null, t) : n != null && n.nodeType ? n.parentNode === e ? e.replaceChild(t, n) : e.appendChild(t) : n != null && e.firstChild ? e.replaceChild(t, e.firstChild) : e.appendChild(t), r && (t[Pr] = r);
	else if (Array.isArray(t)) {
		let i = Array.isArray(n);
		for (let e = 0, r = t.length; e < r; e++) {
			let r = t[e], a = typeof r;
			if (a === "string" || a === "number") {
				let a = i ? n[e] : void 0;
				a && a.nodeType === 3 ? (a.data !== "" + r && (a.data = r), t[e] = a) : t[e] = document.createTextNode(r);
			}
		}
		t.length === 0 ? gi(e, n, r) : i ? n.length === 0 ? pi(e, t, r) : zr(e, n, t, r) : (n != null && gi(e, n), pi(e, t));
	}
	return t;
}
function di(e, t, n, r) {
	if (e = fr(e, {
		skipNonRendered: !0,
		doNotUnwrap: r
	}), r && typeof e == "function") return e;
	if (n && !Array.isArray(e) && (e = [e ?? ""]), Nr.hydrating && Array.isArray(e)) for (let n = 0, r = e.length; n < r; n++) {
		let r = e[n], i = t && t[n], a = typeof r;
		(a === "string" || a === "number") && i && i.nodeType === 3 && oi(i) && (e[n] = i);
	}
	return e;
}
function fi(e, t) {
	if (Array.isArray(e)) for (let n = 0, r = e.length; n < r; n++) fi(e[n], t);
	else e && e.nodeType && e[Fr] !== t && (e[Fr] = t, Object.defineProperty(e, "_$host", {
		get: t,
		configurable: !0
	}));
}
function pi(e, t, n = null) {
	for (let r = 0, i = t.length; r < i; r++) {
		let i = t[r];
		e.insertBefore(i, n), n && (i[Pr] = n);
	}
}
function mi(e, t) {
	if (t == null) return !0;
	if (Array.isArray(t)) return t.length ? e.firstChild === t[0] && e.lastChild === t[t.length - 1] : e.firstChild === null;
	if (t === "") return e.firstChild === null;
	if (t.nodeType) return e.firstChild === t && e.lastChild === t;
	let n = e.firstChild;
	return n !== null && n.nodeType === 3 && e.lastChild === n;
}
function hi(e, t) {
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
function gi(e, t, n, r) {
	if (n === void 0) return mi(e, t) ? e.textContent = "" : hi(e, t);
	if (t.length) {
		let i = !1;
		for (let a = t.length - 1; a >= 0; a--) {
			let o = t[a];
			if (r !== o) {
				let t = o[Pr], s = o.parentNode === e && (!t || t === n);
				r && !i && !a ? s ? e.replaceChild(r, o) : e.insertBefore(r, n) : s && o.remove();
			} else i = !0;
		}
	} else r && e.insertBefore(r, n);
	r && n && (r[Pr] = n);
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/Pipeable.js
var _i = (e, t) => {
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
}, vi = { pipe() {
	return _i(this, arguments);
} }, yi = /*#__PURE__*/ function() {
	function e() {}
	return e.prototype = vi, e;
}(), N = function(e, t) {
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
}, P = (e) => e, bi = (e) => () => e, xi = /*#__PURE__*/ bi(!0), Si = /*#__PURE__*/ bi(!1), Ci = /*#__PURE__*/ bi(void 0), wi = Ci;
function Ti(e) {
	let t = /* @__PURE__ */ new WeakMap();
	return (n) => {
		let r = t.get(n);
		if (r !== void 0) return r;
		let i = e(n);
		return t.set(n, i), i;
	};
}
function Ei(e) {
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
var Di = (e) => {
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
}, Oi = /*#__PURE__*/ new WeakSet(), ki = (e) => new Uint8Array(e.buffer, e.byteOffset, e.byteLength), Ai = 0, ji = () => {
	Ai++;
};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/Predicate.js
function Mi(e) {
	return typeof e == "string";
}
function Ni(e) {
	return typeof e == "number";
}
function Pi(e) {
	return typeof e == "symbol";
}
function Fi(e) {
	return Mi(e) || Ni(e) || Pi(e);
}
function Ii(e) {
	return typeof e == "function";
}
function Li(e) {
	return e != null;
}
function Ri(e) {
	return !0;
}
function zi(e) {
	return typeof e == "object" && !!e || Ii(e);
}
var F = /*#__PURE__*/ N(2, (e, t) => zi(e) && t in e), Bi = /*#__PURE__*/ N(2, (e, t) => F(e, "_tag") && e._tag === t), Vi = "~effect/Hash", I = (e) => {
	switch (typeof e) {
		case "number": return qi(e);
		case "bigint": return Ji(e.toString(10));
		case "string": return Ji(e);
		case "function":
		case "object":
			if (e === null) break;
			if (e instanceof Date) return Number.isNaN(e.getTime()) ? Ji("Invalid Date") : Ji(e.toISOString());
			if (e instanceof RegExp) return Ji(e.toString());
			{
				if (Oi.has(e)) return Hi(e);
				let t = ra.get(e);
				if (t !== void 0) return t;
				if (ia.has(e)) return ji(), Ji("[Circular]");
				ia.add(e);
				let n = Ai, r;
				try {
					r = "~effect/Hash" in e ? e[Vi]() : typeof e == "function" ? Hi(e) : e instanceof DataView ? Qi(ki(e)) : Array.isArray(e) || ArrayBuffer.isView(e) ? Qi(e) : e instanceof Map ? $i(e) : e instanceof Set ? ta(e) : Xi(e);
				} finally {
					ia.delete(e);
				}
				return n === Ai && ra.set(e, r), r;
			}
	}
	return Gi(Ui(Ji(String(e))));
}, Hi = (e) => (na.has(e) || na.set(e, Gi(Math.random() * 4294967296 | 0)), na.get(e)), Ui = (e) => (e ^= e >>> 16, e = Math.imul(e, 2246822507), e ^= e >>> 13, e = Math.imul(e, 3266489909), e ^ e >>> 16), Wi = /*#__PURE__*/ N(2, (e, t) => Ui(Math.imul(e, 2654435761) + Math.imul(t, 2246822507))), Gi = (e) => e & 3221225471 | e >>> 1 & 1073741824, Ki = /*#__PURE__*/ new DataView(/*#__PURE__*/ new ArrayBuffer(8)), qi = (e) => {
	let t = e | 0;
	return t === e ? Gi(t) : (Ki.setFloat64(0, e === e ? e : NaN), Gi(Wi(Ki.getInt32(0), Ki.getInt32(4))));
}, Ji = (e) => {
	let t = 5381, n = e.length;
	for (; n;) t = t * 33 ^ e.charCodeAt(--n);
	return Gi(t);
}, Yi = (e, t) => {
	let n = 12289;
	for (let r of t) n ^= Wi(I(r), I(e[r]));
	return Gi(n);
}, Xi = (e) => Yi(e, Di(e)), Zi = (e, t) => (n) => {
	let r = e;
	for (let e of n) r ^= t(e);
	return Gi(r);
}, Qi = (e) => {
	let t = 6151;
	for (let n of e) t = Wi(t, I(n));
	return Gi(t);
}, $i = /*#__PURE__*/ Zi(/*#__PURE__*/ Ji("Map"), ([e, t]) => Wi(I(e), I(t))), ea = /*#__PURE__*/ Ji("Set"), ta = /*#__PURE__*/ Zi(ea, (e) => Wi(ea, I(e))), na = /*#__PURE__*/ new WeakMap(), ra = /*#__PURE__*/ new WeakMap(), ia = /*#__PURE__*/ new WeakSet(), aa = "~effect/Equal";
function oa() {
	return arguments.length === 1 ? (e) => sa(e, arguments[0]) : sa(arguments[0], arguments[1]);
}
function sa(e, t) {
	if (e === t) return !0;
	if (e == null || t == null) return !1;
	let n = typeof e;
	return n === typeof t ? n === "number" && e !== e && t !== t ? !0 : n !== "object" && n !== "function" || Oi.has(e) || Oi.has(t) ? !1 : ca(e, t) : !1;
}
function ca(e, t) {
	let n = ua.length;
	for (let r = n; r-- > 0;) if (ua[r] === e && da[r] === t) return !0;
	if (n) return la(e, t);
	let r = fa.get(e);
	r || fa.set(e, r = /* @__PURE__ */ new WeakMap());
	let i = r.get(t);
	return i === void 0 && r.set(t, i = la(e, t)), i;
}
function la(e, t) {
	ua.push(e), da.push(t);
	try {
		return pa(e, t);
	} finally {
		ua.pop(), da.pop();
	}
}
var ua = [], da = [], fa = /*#__PURE__*/ new WeakMap();
function pa(e, t) {
	if (I(e) !== I(t)) return !1;
	if (e instanceof Date) {
		if (!(t instanceof Date)) return !1;
		let n = e.getTime(), r = t.getTime();
		return n === r || Number.isNaN(n) && Number.isNaN(r);
	}
	if (e instanceof RegExp) return t instanceof RegExp && e.toString() === t.toString();
	let n = ba(e);
	if (n !== ba(t) || typeof e == "function" && !n) return !1;
	if (n) return e[aa](t);
	if (Array.isArray(e)) return !Array.isArray(t) || e.length !== t.length ? !1 : ma(e, t);
	if (ArrayBuffer.isView(e)) {
		let n = e instanceof DataView;
		return !ArrayBuffer.isView(t) || e.byteLength !== t.byteLength || n !== t instanceof DataView ? !1 : n ? ha(ki(e), ki(t)) : ha(e, t);
	}
	return e instanceof Map ? !(t instanceof Map) || e.size !== t.size ? !1 : _a(e, t, va, ya) : e instanceof Set ? !(t instanceof Set) || e.size !== t.size ? !1 : _a(e, t, I, sa) : ga(e, t);
}
function ma(e, t) {
	for (let n = 0; n < e.length; n++) if (!sa(e[n], t[n])) return !1;
	return !0;
}
function ha(e, t) {
	if (e.length !== t.length) return !1;
	for (let n = 0; n < e.length; n++) if (e[n] !== t[n]) return !1;
	return !0;
}
function ga(e, t) {
	let n = Di(e), r = Di(t);
	if (n.size !== r.size) return !1;
	for (let i of n) if (!r.has(i) || !sa(e[i], t[i])) return !1;
	return !0;
}
function _a(e, t, n, r) {
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
var va = (e) => I(e[0]), ya = (e, t) => sa(e[0], t[0]) && sa(e[1], t[1]), ba = (e) => F(e, aa), xa = /*#__PURE__*/ Symbol.for("~effect/Redactable"), Sa = (e) => F(e, xa);
function Ca(e) {
	return Sa(e) ? wa(e) : e;
}
function wa(e) {
	return e[xa](globalThis["~effect/Fiber/currentFiber"]?.context ?? Da);
}
var Ta = "~effect/Fiber/currentFiber", Ea = /*#__PURE__*/ new Map(), Da = {
	"~effect/Context": {},
	base: Ea,
	depth: 0,
	mapUnsafe: Ea,
	pipe() {
		return _i(this, arguments);
	}
};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/Formatter.js
function Oa(e, t) {
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
			if (r.has(e)) return ka;
			r.add(e);
			let l;
			if (xa in e) l = c(wa(e), n);
			else if (Array.isArray(e)) l = !i || e.length <= 1 ? `[${e.map((e) => c(e, n)).join(",")}]` : `[\n${a(n + 1)}${e.map((e) => c(e, n + 1)).join(",\n" + a(n + 1))}\n${a(n)}]`;
			else if (e instanceof Date) l = Ma(e);
			else if (!t?.ignoreToString && F(e, "toString") && typeof e.toString == "function" && e.toString !== Object.prototype.toString && e.toString !== Array.prototype.toString) {
				let t = Na(e);
				l = e instanceof Error && e.cause !== void 0 ? `${t} (cause: ${c(e.cause, n)})` : t;
			} else if (Symbol.iterator in e) l = `${e.constructor.name}(${c(Array.from(e), n)})`;
			else {
				let t = s(e);
				if (!i || t.length <= 1) {
					let r = `{${t.map((t) => `${Aa(t)}:${c(Pa(e, t), n)}`).join(",")}}`;
					l = o(e, r);
				} else {
					let r = `{\n${t.map((t) => `${a(n + 1)}${Aa(t)}: ${c(Pa(e, t), n + 1)}`).join(",\n")}\n${a(n)}}`;
					l = o(e, r);
				}
			}
			return r.delete(e), l;
		}
		return String(e);
	}
	return c(e, 0);
}
var ka = "[Circular]";
function Aa(e) {
	return typeof e == "string" ? JSON.stringify(e) : String(e);
}
function ja(e) {
	return e.map((e) => `[${Aa(e)}]`).join("");
}
function Ma(e) {
	try {
		return e.toISOString();
	} catch {
		return "Invalid Date";
	}
}
function Na(e) {
	try {
		let t = e.toString();
		return typeof t == "string" ? t : String(t);
	} catch {
		return "[toString threw]";
	}
}
function Pa(e, t) {
	try {
		return e[t];
	} catch {
		return "[property access threw]";
	}
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/Inspectable.js
var Fa = /*#__PURE__*/ Symbol.for("nodejs.util.inspect.custom"), Ia = (e) => {
	try {
		return e = Ca(e), F(e, "toJSON") && Ii(e.toJSON) && e.toJSON.length === 0 ? e.toJSON() : Array.isArray(e) ? e.map(Ia) : e;
	} catch {
		return "[toJSON threw]";
	}
}, La = {
	toJSON() {
		return Ia(this);
	},
	[Fa]() {
		return this.toJSON();
	},
	toString() {
		return Oa(this.toJSON());
	}
}, Ra = /*#__PURE__*/ (() => {
	let e = Object.getOwnPropertyDescriptor(Error, "stackTraceLimit");
	return e === void 0 ? Object.isExtensible(Error) : Object.hasOwn(e, "writable") ? e.writable === !0 : e.set !== void 0;
})(), za = () => Error.stackTraceLimit, Ba = (e) => {
	Ra && (Error.stackTraceLimit = e);
}, Va = class {
	constructor(e) {
		this.value = e, this.done = !1;
	}
	next(e) {
		return this.done ? (this.value = e, this) : (this.done = !0, {
			value: this.value,
			done: !1
		});
	}
}, Ha = /*#__PURE__*/ (() => {
	let e = "~effect/Utils/internal", t = { [e]: (e) => e() }, n = { [e]: (e) => {
		try {
			return e();
		} finally {}
	} };
	return za() !== 0 && t[e](() => (/* @__PURE__ */ Error()).stack)?.includes(e) === !0 ? t[e] : n[e];
})();
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/internal/record.js
function Ua(e, t, n) {
	t === "__proto__" ? Object.defineProperty(e, t, {
		value: n,
		writable: !0,
		enumerable: !0,
		configurable: !0
	}) : e[t] = n;
}
function Wa(e, t) {
	for (let n of Reflect.ownKeys(t)) Object.prototype.propertyIsEnumerable.call(t, n) && Ua(e, n, t[n]);
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/internal/core.js
var Ga = "~effect/Effect", Ka = "~effect/Exit", qa = {
	_A: P,
	_E: P,
	_R: P
}, Ja = `${Ga}/identifier`, L = `${Ga}/args`, R = `${Ga}/evaluate`, Ya = `${Ga}/successCont`, Xa = `${Ga}/failureCont`, Za = `${Ga}/ensureCont`, Qa = /*#__PURE__*/ Symbol.for("effect/Effect/Yield"), $a = {
	pipe() {
		return _i(this, arguments);
	},
	toJSON() {
		return { ...this };
	},
	toString() {
		return Oa(this.toJSON(), {
			ignoreToString: !0,
			space: 2
		});
	},
	[Fa]() {
		return this.toJSON();
	}
}, eo = {
	[Ga]: qa,
	...$a,
	[Symbol.iterator]() {
		return new Va(this);
	},
	toJSON() {
		return {
			_id: "Effect",
			op: this[Ja],
			...L in this ? { args: this[L] } : void 0
		};
	}
}, to = (e) => F(e, Ga), no = (e) => F(e, Ka), ro = "~effect/Cause", io = "~effect/Cause/Reason", ao = (e) => F(e, ro), oo = class {
	constructor(e) {
		this[ro] = ro, this.reasons = e;
	}
	pipe() {
		return _i(this, arguments);
	}
	toJSON() {
		return {
			_id: "Cause",
			failures: this.reasons.map((e) => e.toJSON())
		};
	}
	toString() {
		return `Cause(${Oa(this.reasons)})`;
	}
	[Fa]() {
		return this.toJSON();
	}
	[aa](e) {
		return ao(e) && this.reasons.length === e.reasons.length && this.reasons.every((t, n) => oa(t, e.reasons[n]));
	}
	[Vi]() {
		return Qi(this.reasons);
	}
}, so = /*#__PURE__*/ new WeakMap(), co = class {
	[io];
	annotations;
	_tag;
	constructor(e, t, n) {
		if (this[io] = io, this._tag = e, t !== lo && typeof n == "object" && n && t.size > 0) {
			let e = so.get(n);
			e && (t = new Map([...e, ...t])), so.set(n, t);
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
		return _i(this, arguments);
	}
	toString() {
		return Oa(this);
	}
	[Fa]() {
		return this.toString();
	}
}, lo = /*#__PURE__*/ new Map(), uo = class extends co {
	constructor(e, t = lo) {
		super("Fail", t, e), this.error = e;
	}
	toString() {
		return `Fail(${Oa(this.error)})`;
	}
	toJSON() {
		return {
			_tag: "Fail",
			error: this.error
		};
	}
	[aa](e) {
		return _o(e) && oa(this.error, e.error) && oa(this.annotations, e.annotations);
	}
	[Vi]() {
		return Wi(Ji(this._tag))(Wi(I(this.error))(I(this.annotations)));
	}
}, fo = (e) => new oo(e), po = (e) => new oo([new uo(e)]), mo = class extends co {
	constructor(e, t = lo) {
		super("Die", t, e), this.defect = e;
	}
	toString() {
		return `Die(${Oa(this.defect)})`;
	}
	toJSON() {
		return {
			_tag: "Die",
			defect: this.defect
		};
	}
	[aa](e) {
		return vo(e) && oa(this.defect, e.defect) && oa(this.annotations, e.annotations);
	}
	[Vi]() {
		return Wi(Ji(this._tag))(Wi(I(this.defect))(I(this.annotations)));
	}
}, ho = (e) => new oo([new mo(e)]), go = /*#__PURE__*/ N((e) => ao(e[0]), (e, t, n) => t.mapUnsafe.size === 0 ? e : new oo(e.reasons.map((e) => e.annotate(t, n)))), _o = (e) => e._tag === "Fail", vo = (e) => e._tag === "Die", yo = (e) => e._tag === "Interrupt";
function bo(e) {
	return Oo("Effect.evaluate: Not implemented");
}
var xo = (e) => ({
	...eo,
	[Ja]: e.op,
	[R]: e[R] ?? bo,
	[Ya]: e[Ya],
	[Xa]: e[Xa],
	[Za]: e[Za]
}), So = (e) => {
	let t = xo(e), n = function(e) {
		this[L] = e;
	};
	return n.prototype = t, function(e) {
		return new n(e);
	};
}, Co = (e) => {
	let t = {
		[Ka]: Ka,
		_tag: e.op,
		get [e.prop]() {
			return this[L];
		},
		...xo(e),
		toString() {
			return `${e.op}(${Oa(this[L])})`;
		},
		toJSON() {
			return {
				_id: "Exit",
				_tag: e.op,
				[e.prop]: this[L]
			};
		},
		[aa](e) {
			return no(e) && e._tag === this._tag && oa(this[L], e[L]);
		},
		[Vi]() {
			return Wi(Ji(e.op), I(this[L]));
		}
	}, n = function(e) {
		this[L] = e;
	};
	return n.prototype = t, function(e) {
		return new n(e);
	};
}, z = /*#__PURE__*/ Co({
	op: "Success",
	prop: "value",
	[R](e) {
		let t = e.getCont(Ya);
		return t ? t[Ya](this[L], e, this) : e.yieldWith(this);
	}
}), wo = { key: "effect/Cause/StackTrace" }, To = { key: "effect/Cause/InterruptorStackTrace" }, Eo = /*#__PURE__*/ Co({
	op: "Failure",
	prop: "cause",
	[R](e) {
		let t = this[L], n = !1;
		e.cache.stackFrame && (t = go(t, { mapUnsafe: /* @__PURE__ */ new Map([[wo.key, e.cache.stackFrame]]) }), n = !0);
		let r = e.getCont(Xa);
		for (; e.interruptible && e._interruptedCause && r;) r = e.getCont(Xa);
		return r ? r[Xa](t, e, n ? void 0 : this) : e.yieldWith(n ? Eo(t) : this);
	}
}), Do = (e) => Eo(po(e)), Oo = (e) => Eo(ho(e)), B = /*#__PURE__*/ So({
	op: "WithFiber",
	[R](e) {
		return this[L](e);
	}
}), ko = /*#__PURE__*/ function() {
	class e extends globalThis.Error {}
	let t = /*#__PURE__*/ xo({
		op: "YieldableError",
		[R]() {
			return Do(this);
		}
	});
	return delete t.toString, Object.assign(e.prototype, t), e;
}(), Ao = /*#__PURE__*/ function() {
	let e = /*#__PURE__*/ Symbol.for("effect/Data/Error/plainArgs");
	return class extends ko {
		constructor(t) {
			super(t?.message, t?.cause ? { cause: t.cause } : void 0), t && (Wa(this, t), Object.defineProperty(this, e, {
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
}(), jo = (e) => {
	class t extends Ao {
		_tag = e;
	}
	return t.prototype.name = e, t;
}, Mo = "~effect/Cause/Done", No = (e) => F(e, Mo), Po = {
	[Mo]: Mo,
	_tag: "Done",
	value: void 0
}, Fo = (e) => e === void 0 ? Po : {
	[Mo]: Mo,
	_tag: "Done",
	value: e
}, Io = /*#__PURE__*/ Do(Po), Lo = (e) => e === void 0 ? Io : Do(Fo(e)), Ro = (e) => xo({
	op: e.label,
	[R]: e.evaluate
}), zo = "~effect/Option", Bo = {
	[zo]: { _A: (e) => e },
	...$a,
	[Symbol.iterator]() {
		return new Va(this);
	}
}, Vo = /*#__PURE__*/ Object.defineProperty(/*#__PURE__*/ Object.assign(/*#__PURE__*/ Object.create(Bo), {
	_tag: "Some",
	_op: "Some",
	[aa](e) {
		return Wo(e) && Ko(e) && oa(this.value, e.value);
	},
	[Vi]() {
		return Wi(I(this._tag))(I(this.value));
	},
	toString() {
		return `some(${Oa(this.value)})`;
	},
	toJSON() {
		return {
			_id: "Option",
			_tag: this._tag,
			value: Ia(this.value)
		};
	}
}), "valueOrUndefined", { get() {
	return this.value;
} }), Ho = /*#__PURE__*/ I("None"), Uo = /*#__PURE__*/ Object.assign(/*#__PURE__*/ Object.create(Bo), {
	_tag: "None",
	_op: "None",
	valueOrUndefined: void 0,
	[aa](e) {
		return Wo(e) && Go(e);
	},
	[Vi]() {
		return Ho;
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
}), Wo = (e) => F(e, zo), Go = (e) => e._tag === "None", Ko = (e) => e._tag === "Some", qo = /*#__PURE__*/ Object.create(Uo), Jo = function(e) {
	this.value = e;
};
Jo.prototype = Vo;
var Yo = (e) => new Jo(e), Xo = "~effect/Result", Zo = {
	[Xo]: {
		/* v8 ignore next 2 */
		_A: (e) => e,
		_E: (e) => e
	},
	...$a,
	[Symbol.iterator]() {
		return new Va(this);
	}
}, Qo = /*#__PURE__*/ Object.assign(/*#__PURE__*/ Object.create(Zo), {
	_tag: "Success",
	_op: "Success",
	[aa](e) {
		return es(e) && ns(e) && oa(this.success, e.success);
	},
	[Vi]() {
		return Wi(I(this._tag))(I(this.success));
	},
	toString() {
		return `success(${Oa(this.success)})`;
	},
	toJSON() {
		return {
			_id: "Result",
			_tag: this._tag,
			value: Ia(this.success)
		};
	}
}), $o = /*#__PURE__*/ Object.assign(/*#__PURE__*/ Object.create(Zo), {
	_tag: "Failure",
	_op: "Failure",
	[aa](e) {
		return es(e) && ts(e) && oa(this.failure, e.failure);
	},
	[Vi]() {
		return Wi(I(this._tag))(I(this.failure));
	},
	toString() {
		return `failure(${Oa(this.failure)})`;
	},
	toJSON() {
		return {
			_id: "Result",
			_tag: this._tag,
			failure: Ia(this.failure)
		};
	}
}), es = (e) => F(e, Xo), ts = (e) => e._tag === "Failure", ns = (e) => e._tag === "Success", rs = function(e) {
	this.failure = e;
};
rs.prototype = $o;
var is = (e) => new rs(e), as = function(e) {
	this.success = e;
};
as.prototype = Qo;
var os = (e) => new as(e);
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/Order.js
function ss(e) {
	return (t, n) => t === n ? 0 : e(t, n);
}
var cs = /*#__PURE__*/ ss((e, t) => e < t ? -1 : 1), ls = /*#__PURE__*/ ss((e, t) => globalThis.Number.isNaN(e) && globalThis.Number.isNaN(t) ? 0 : globalThis.Number.isNaN(e) ? -1 : globalThis.Number.isNaN(t) ? 1 : e < t ? -1 : 1), us = /*#__PURE__*/ N(2, (e, t) => ss((n, r) => e(t(n), t(r)))), ds = (e) => N(2, (t, n) => e(t, n) === 1), fs = () => qo, ps = Yo, ms = Go, hs = Ko, gs = /*#__PURE__*/ (/* @__PURE__ */ N(2, (e, t) => ms(e) ? t() : e.value))(Ci), _s = "~effect/Context/Service", vs = function() {
	function e() {}
	let t = e;
	Object.setPrototypeOf(t, ys);
	let n = (e, n) => (t.key = e, n?.defaultValue && (t[xs] = xs, t.defaultValue = n.defaultValue), n?.make && (t.make = n.make), n?.fiberCached && bs.add(e), t);
	return arguments.length > 0 ? n(arguments[0], arguments[1]) : n;
}, ys = {
	[_s]: _s,
	.../*#__PURE__*/ Ro({
		label: "Service",
		evaluate(e) {
			return z(Ws(e.context, this));
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
		return Rs(this, e);
	},
	use(e) {
		return B((t) => e(Ws(t.context, this)));
	},
	useSync(e) {
		return B((t) => z(e(Ws(t.context, this))));
	}
}, bs = /*#__PURE__*/ new Set(), xs = "~effect/Context/Reference", Ss = "~effect/Context", Cs = 8, ws = 8, Ts = (e, t, n, r) => {
	let i = Object.create(Ms);
	return i.cacheRoot = e ?? i, i.base = t, i.overlay = n, i.depth = r, i._flat = void 0, i.baseHits = 0, i;
}, Es = (e, t) => {
	t && (Es(e, t.parent), e.set(t.key, t.value));
}, Ds = (e) => {
	if (e._flat) return e._flat;
	if (!e.overlay) return e._flat = e.base;
	let t = new Map(e.base);
	return Es(t, e.overlay), e._flat = t;
}, Os = (e, t) => {
	let n = new Map(e.mapUnsafe);
	return t(n), js(n);
}, ks = /*#__PURE__*/ Symbol(), As = (e, t) => {
	let n = e;
	for (let e = n.overlay; e; e = e.parent) if (e.key === t) return e.value;
	let r = n.base.get(t);
	return r === void 0 && !n.base.has(t) ? ks : (n.overlay && ++n.baseHits >= n.base.size && n.baseHits >= ws && (n.base = Ds(n), n.overlay = void 0, n.depth = 0), r);
}, js = (e) => Ts(void 0, e, void 0, 0), Ms = {
	get mapUnsafe() {
		return Ds(this);
	},
	...$a,
	[Ss]: { _Services: (e) => e },
	toJSON() {
		return {
			_id: "Context",
			services: Array.from(this.mapUnsafe).map(([e, t]) => ({
				key: e,
				value: t
			}))
		};
	},
	[aa](e) {
		if (!Ps(e)) return !1;
		let t = this.mapUnsafe, n = e.mapUnsafe;
		if (t.size !== n.size) return !1;
		for (let [e, r] of t) if (!n.has(e) || !oa(r, n.get(e))) return !1;
		return !0;
	},
	[Vi]() {
		return qi(this.mapUnsafe.size);
	}
}, Ns = (e, t) => e.cacheRoot === t.cacheRoot, Ps = (e) => F(e, Ss), Fs = (e) => !!e[xs], Is = () => Ls, Ls = /*#__PURE__*/ js(/*#__PURE__*/ new Map()), Rs = (e, t) => js(/* @__PURE__ */ new Map([[e.key, t]])), zs = /*#__PURE__*/ N(3, (e, t, n) => Bs(e, t.key, n)), Bs = (e, t, n) => {
	let r = e, i = bs.has(t) ? void 0 : r.cacheRoot;
	if (r.depth >= Cs) {
		let e = new Map(r.mapUnsafe);
		return e.set(t, n), Ts(i, e, void 0, 0);
	}
	return Ts(i, r.base, {
		key: t,
		value: n,
		parent: r.overlay
	}, r.depth + 1);
}, Vs = /*#__PURE__*/ N(2, (e, t) => Hs(e, t.key)), Hs = (e, t) => {
	let n = As(e, t);
	return n === ks ? void 0 : n;
}, Us = /*#__PURE__*/ N(2, (e, t) => {
	let n = As(e, t.key);
	if (n === ks) {
		if (Fs(t)) return Ks(t);
		throw qs(t);
	}
	return n;
}), Ws = Us, Gs = "~effect/Context/defaultValue", Ks = (e) => Gs in e ? e[Gs] : e[Gs] = e.defaultValue(), qs = (e) => {
	let t = /* @__PURE__ */ Error(`Service not found${e.key ? `: ${String(e.key)}` : ""}`);
	if (t.stack) {
		let e = t.stack.split("\n");
		e.splice(1, 3), t.stack = e.join("\n");
	}
	return t;
}, Js = /*#__PURE__*/ N(2, (e, t) => e.mapUnsafe.size === 0 ? t : t.mapUnsafe.size === 0 ? e : Os(e, (e) => t.mapUnsafe.forEach((t, n) => e.set(n, t)))), Ys = (...e) => {
	let t = /* @__PURE__ */ new Map();
	for (let n = 0; n < e.length; n++) e[n].mapUnsafe.forEach((e, n) => {
		t.set(n, e);
	});
	return js(t);
}, Xs = vs, Zs = (e) => e.length > 0, Qs = (e) => e > 0 ? Math.floor(e) : 0, $s = os, ec = is, tc = (e) => {
	if (Ii(e)) try {
		return $s(e());
	} catch (e) {
		return ec(e);
	}
	try {
		return $s(e.try());
	} catch (t) {
		return ec(e.catch(t));
	}
}, nc = ts, rc = /*#__PURE__*/ N(2, (e, t) => nc(e) ? t(e.failure) : e.success), ic = /*#__PURE__*/ rc(Ci), ac = globalThis.Array, oc = (e) => ac.isArray(e) ? e : ac.from(e), sc = /*#__PURE__*/ N(2, (e, t) => [...e, t]);
ac.isArray;
var cc = Zs, lc = Zs, uc = (e) => e[e.length - 1], dc = () => [], fc = (e) => [e], pc = /*#__PURE__*/ N(2, (e, t) => e.map(t)), mc = "~effect/Duration", hc = /*#__PURE__*/ BigInt(0), gc = /*#__PURE__*/ BigInt(1), _c = /*#__PURE__*/ BigInt(2), vc = /*#__PURE__*/ BigInt(10), yc = /*#__PURE__*/ BigInt(1e3), bc = (e) => BigInt(e < 0 ? Math.ceil(e - .5) : Math.floor(e + .5)), xc = (e) => bc(e * 1e6), Sc = (e, t) => {
	let n = e.indexOf(".");
	if (n === -1) return BigInt(e) * t;
	let r = e[0] === "-", i = e.slice(n + 1), a = vc ** BigInt(i.length), o = (BigInt(e.slice(+!!r, n)) * a + BigInt(i)) * t, s = o / a + (o % a * _c >= a ? gc : hc);
	return r ? -s : s;
}, Cc = /^(-?\d+(?:\.\d+)?)\s+(nanos?|micros?|millis?|seconds?|minutes?|hours?|days?|weeks?)$/, wc = (e) => {
	switch (typeof e) {
		case "number": return Ic(e);
		case "bigint": return Fc(e);
		case "string": {
			if (e === "Infinity") return Nc;
			if (e === "-Infinity") return Pc;
			let t = Cc.exec(e);
			if (!t) break;
			let [n, r, i] = t;
			if (i === "nano" || i === "nanos") return Fc(Sc(r, gc));
			if (i === "micro" || i === "micros") return Fc(Sc(r, yc));
			let a = Number(r);
			switch (i) {
				case "milli":
				case "millis": return Ic(a);
				case "second":
				case "seconds": return Lc(a);
				case "minute":
				case "minutes": return Rc(a);
				case "hour":
				case "hours": return zc(a);
				case "day":
				case "days": return Bc(a);
				case "week":
				case "weeks": return Vc(a);
			}
			break;
		}
		case "object": {
			if (e === null) break;
			if (mc in e) return e;
			if (Array.isArray(e)) return e.length !== 2 || !e.every(Ni) ? Tc(e) : Number.isNaN(e[0]) || Number.isNaN(e[1]) ? Mc : e[0] === -Infinity || e[1] === -Infinity ? Pc : e[0] === Infinity || e[1] === Infinity ? Nc : Ac(bc(e[0] * 1e9 + e[1]));
			let t = e, n = 0;
			return t.weeks && (n += t.weeks * 6048e5), t.days && (n += t.days * 864e5), t.hours && (n += t.hours * 36e5), t.minutes && (n += t.minutes * 6e4), t.seconds && (n += t.seconds * 1e3), t.milliseconds && (n += t.milliseconds), !t.microseconds && !t.nanoseconds ? Ac(n) : Ac(bc(n * 1e6 + (t.microseconds ?? 0) * 1e3 + (t.nanoseconds ?? 0)));
		}
	}
	return Tc(e);
}, Tc = (e) => {
	throw Error(`Invalid Input: ${e}`);
}, Ec = {
	_tag: "Millis",
	millis: 0
}, Dc = { _tag: "Infinity" }, Oc = { _tag: "NegativeInfinity" }, kc = {
	[mc]: mc,
	[Vi]() {
		switch (this.value._tag) {
			case "Millis": {
				let e = this.value.millis * 1e6;
				return Number.isFinite(e) ? I(bc(e)) : qi(this.value.millis);
			}
			case "Nanos": return I(this.value.nanos);
			default: return Xi(this.value);
		}
	},
	[aa](e) {
		return jc(e) && qc(this, e);
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
	[Fa]() {
		return this.toJSON();
	},
	pipe() {
		return _i(this, arguments);
	}
}, Ac = (e) => {
	let t = Object.create(kc);
	return t.value = typeof e == "number" ? isNaN(e) || e === 0 || Object.is(e, -0) ? Ec : Number.isFinite(e) ? Number.isInteger(e) ? {
		_tag: "Millis",
		millis: e
	} : {
		_tag: "Nanos",
		nanos: xc(e)
	} : e > 0 ? Dc : Oc : e === hc ? Ec : {
		_tag: "Nanos",
		nanos: e
	}, t;
}, jc = (e) => F(e, mc), Mc = /*#__PURE__*/ Ac(0), Nc = /*#__PURE__*/ Ac(Infinity), Pc = /*#__PURE__*/ Ac(-Infinity), Fc = (e) => Ac(e), Ic = (e) => Ac(e), Lc = (e) => Ac(e * 1e3), Rc = (e) => Ac(e * 6e4), zc = (e) => Ac(e * 36e5), Bc = (e) => Ac(e * 864e5), Vc = (e) => Ac(e * 6048e5), Hc = (e) => Wc(wc(e), {
	onMillis: P,
	onNanos: (e) => Number(e) / 1e6,
	onInfinity: () => Infinity,
	onNegativeInfinity: () => -Infinity
}), Uc = (e) => {
	let t = wc(e);
	switch (t.value._tag) {
		case "Infinity":
		case "NegativeInfinity": throw Error("Cannot convert infinite duration to nanos");
		case "Nanos": return t.value.nanos;
		case "Millis": return xc(t.value.millis);
	}
}, Wc = /*#__PURE__*/ N(2, (e, t) => {
	switch (e.value._tag) {
		case "Millis": return t.onMillis(e.value.millis);
		case "Nanos": return t.onNanos(e.value.nanos);
		case "Infinity": return t.onInfinity();
		case "NegativeInfinity": return (t.onNegativeInfinity ?? t.onInfinity)();
	}
}), Gc = /*#__PURE__*/ N(3, (e, t, n) => e.value._tag === "Infinity" || e.value._tag === "NegativeInfinity" || t.value._tag === "Infinity" || t.value._tag === "NegativeInfinity" ? n.onInfinity(e, t) : e.value._tag === "Millis" ? t.value._tag === "Millis" ? n.onMillis(e.value.millis, t.value.millis) : n.onNanos(Uc(e), t.value.nanos) : n.onNanos(e.value.nanos, Uc(t))), Kc = (e, t) => Gc(e, t, {
	onMillis: (e, t) => e === t,
	onNanos: (e, t) => e === t,
	onInfinity: (e, t) => e.value._tag === t.value._tag
}), qc = /*#__PURE__*/ N(2, (e, t) => Kc(e, t)), Jc = /*#__PURE__*/ Xs("effect/Scheduler", {
	fiberCached: !0,
	defaultValue: () => new $c()
}), Yc = (e) => {
	let t = !1;
	return Promise.resolve().then(() => {
		t || e();
	}), () => {
		t = !0;
	};
}, Xc = "setImmediate" in globalThis ? (e) => {
	let t = globalThis.setImmediate(e);
	return () => globalThis.clearImmediate(t);
} : (e) => {
	let t = setTimeout(e, 0);
	return () => clearTimeout(t);
}, Zc = (e) => {
	try {
		return Xc(e);
	} catch {
		return Yc(e);
	}
}, Qc = class {
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
}, $c = class {
	executionMode;
	setImmediate;
	constructor(e = "async", t) {
		this.executionMode = e, this.setImmediate = t ?? (e === "sync" ? Yc : Zc);
	}
	shouldYield(e) {
		return e.currentOpCount >= e.cache.maxOpsBeforeYield;
	}
	makeDispatcher() {
		return new el(this.setImmediate);
	}
}, el = class {
	tasks = /*#__PURE__*/ new Qc();
	running = void 0;
	setImmediate;
	constructor(e = Zc) {
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
}, tl = /*#__PURE__*/ Xs("effect/Scheduler/MaxOpsBeforeYield", {
	fiberCached: !0,
	defaultValue: () => 2048
}), nl = /*#__PURE__*/ Xs("effect/Scheduler/PreventSchedulerYield", {
	fiberCached: !0,
	defaultValue: () => !1
}), rl = jo, il = (e) => {
	switch (e) {
		case 16: return sl();
		case 32: return cl();
		default: {
			let t = "";
			for (let n = e >>> 3; n > 0; n--) t += ol();
			return t;
		}
	}
}, V = /*#__PURE__*/ Uint8Array.from("0123456789abcdef", (e) => e.charCodeAt(0)), al = () => Math.random() * 4294967296 >>> 0, ol = () => {
	let e = al();
	return String.fromCharCode(V[e >>> 28], V[e >>> 24 & 15], V[e >>> 20 & 15], V[e >>> 16 & 15], V[e >>> 12 & 15], V[e >>> 8 & 15], V[e >>> 4 & 15], V[e & 15]);
}, sl = () => {
	let e = al(), t = al();
	return String.fromCharCode(V[e >>> 28], V[e >>> 24 & 15], V[e >>> 20 & 15], V[e >>> 16 & 15], V[e >>> 12 & 15], V[e >>> 8 & 15], V[e >>> 4 & 15], V[e & 15], V[t >>> 28], V[t >>> 24 & 15], V[t >>> 20 & 15], V[t >>> 16 & 15], V[t >>> 12 & 15], V[t >>> 8 & 15], V[t >>> 4 & 15], V[t & 15]);
}, cl = () => {
	let e = al(), t = al(), n = al(), r = al();
	return String.fromCharCode(V[e >>> 28], V[e >>> 24 & 15], V[e >>> 20 & 15], V[e >>> 16 & 15], V[e >>> 12 & 15], V[e >>> 8 & 15], V[e >>> 4 & 15], V[e & 15], V[t >>> 28], V[t >>> 24 & 15], V[t >>> 20 & 15], V[t >>> 16 & 15], V[t >>> 12 & 15], V[t >>> 8 & 15], V[t >>> 4 & 15], V[t & 15], V[n >>> 28], V[n >>> 24 & 15], V[n >>> 20 & 15], V[n >>> 16 & 15], V[n >>> 12 & 15], V[n >>> 8 & 15], V[n >>> 4 & 15], V[n & 15], V[r >>> 28], V[r >>> 24 & 15], V[r >>> 20 & 15], V[r >>> 16 & 15], V[r >>> 12 & 15], V[r >>> 8 & 15], V[r >>> 4 & 15], V[r & 15]);
}, ll = "effect/Tracer/ParentSpan", ul = class extends (/*#__PURE__*/ vs()(ll, { fiberCached: !0 })) {}, dl = (e) => e, fl = /*#__PURE__*/ Xs("effect/Tracer/DisablePropagation", { defaultValue: Si }), pl = /*#__PURE__*/ Xs("effect/Tracer/CurrentTraceLevel", { defaultValue: () => "Info" }), ml = /*#__PURE__*/ Xs("effect/Tracer/MinimumTraceLevel", { defaultValue: () => "All" }), hl = "effect/Tracer", gl = /*#__PURE__*/ dl({ span: (e) => new _l(e) }), _l = class {
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
		return this._traceId ??= gs(this.parent)?.traceId ?? il(32);
	}
	get spanId() {
		return this._spanId ??= il(16);
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
}, vl = "effect/Metric/FiberRuntimeMetrics", yl = /*#__PURE__*/ Xs("effect/References/CurrentStackFrame", {
	fiberCached: !0,
	defaultValue: Ci
}), bl = /*#__PURE__*/ Xs("effect/References/TracerEnabled", {
	fiberCached: !0,
	defaultValue: xi
}), xl = /*#__PURE__*/ Xs("effect/References/TracerTimingEnabled", { defaultValue: xi }), Sl = /*#__PURE__*/ Xs("effect/References/TracerSpanAnnotations", { defaultValue: () => ({}) }), Cl = /*#__PURE__*/ Xs("effect/References/TracerSpanLinks", { defaultValue: () => [] }), wl = /*#__PURE__*/ Xs("effect/References/CurrentLogLevel", {
	fiberCached: !0,
	defaultValue: () => "Info"
}), Tl = /*#__PURE__*/ Xs("effect/References/MinimumLogLevel", {
	fiberCached: !0,
	defaultValue: () => "Info"
}), El = (e) => (t) => {
	let n;
	return () => {
		if (n !== void 0) return n;
		let r = t();
		if (!r) return;
		let i = r.split("\n");
		if (i[e] !== void 0) return n = i[e].trim(), n;
	};
}, Dl = class extends co {
	constructor(e, t = lo) {
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
	[aa](e) {
		return yo(e) && this.fiberId === e.fiberId && this.annotations === e.annotations;
	}
	[Vi]() {
		return Wi(Ji(`${this._tag}:${this.fiberId}`))(Hi(this.annotations));
	}
}, Ol = (e) => new oo([new Dl(e)]), kl = (e) => {
	for (let t = 0; t < e.reasons.length; t++) {
		let n = e.reasons[t];
		if (n._tag === "Fail") return $s(n.error);
	}
	return ec(e);
}, Al = (e) => e.reasons.some(yo), jl = (e) => {
	let t;
	for (let n = 0; n < e.reasons.length; n++) {
		let r = e.reasons[n];
		r._tag === "Interrupt" && (t ??= /* @__PURE__ */ new Set(), r.fiberId !== void 0 && t.add(r.fiberId));
	}
	return t ? $s(t) : ec(e);
}, Ml = (e, t) => {
	let n = /* @__PURE__ */ new Map(), r = [];
	for (let i of e.concat(t)) {
		let e = I(i), t = n.get(e);
		if (t === void 0) n.set(e, [i]);
		else if (t.some((e) => oa(e, i))) continue;
		else t.push(i);
		r.push(i);
	}
	return r;
}, Nl = /*#__PURE__*/ N(2, (e, t) => {
	if (e.reasons.length === 0) return t;
	if (t.reasons.length === 0) return e;
	let n = new oo(Ml(e.reasons, t.reasons));
	return oa(e, n) ? e : n;
}), Pl = /*#__PURE__*/ N(2, (e, t) => {
	let n = !1, r = e.reasons.map((e) => _o(e) ? (n = !0, new uo(t(e.error), e.annotations)) : e);
	return n ? fo(r) : e;
}), Fl = (e) => {
	let t;
	for (let n of e.reasons) {
		if (n._tag === "Fail") return n.error;
		n._tag === "Die" && (t ??= n);
	}
	return t === void 0 ? e.reasons.length > 0 ? new globalThis.Error("All fibers interrupted without error") : new globalThis.Error("Empty cause") : t.defect;
}, Il = "~effect/Fiber", Ll = {
	_A: P,
	_E: P
}, Rl = { id: 0 }, zl = () => globalThis[Ta], Bl = class {
	constructor(e, t = !0) {
		this.setContext(e), this.id = ++Rl.id, this.currentOpCount = 0, this.interruptible = t, this._stack = [], this._observers = void 0, this._exit = void 0, this._children = void 0, this._interruptedCause = void 0, this._yielded = void 0, this._running = !1, this._deferredInterrupt = !1, this._parent = void 0, this.cache.runtimeMetrics?.recordFiberStart(this.context);
	}
	get [Il]() {
		return Ll;
	}
	get currentDispatcher() {
		return this._dispatcher ??= this.cache.scheduler.makeDispatcher();
	}
	getRef(e) {
		return Ws(this.context, e);
	}
	addObserver(e) {
		return this._exit ? (e(this._exit), wi) : (this._observers === void 0 ? this._observers = [e] : this._observers.push(e), () => this.removeObserver(e));
	}
	removeObserver(e) {
		if (this._exit || this._observers === void 0) return;
		let t = this._observers.indexOf(e);
		t >= 0 && this._observers.splice(t, 1);
	}
	interruptUnsafe(e, t) {
		if (this._exit) return;
		let n = Ol(e);
		this.cache.stackFrame && (n = go(n, Rs(wo, this.cache.stackFrame))), t && (n = go(n, t)), this._interruptedCause = this._interruptedCause ? Nl(this._interruptedCause, n) : n, this.interruptible && (this._running ? this._deferredInterrupt = !0 : this.evaluate(Ql(this._interruptedCause)));
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
		if (t === Qa) return;
		let n = Wl.interruptChildren && Wl.interruptChildren(this);
		if (n !== void 0) return this.evaluate(K(n, () => t));
		if (this._exit = t, this.cache.runtimeMetrics?.recordFiberEnd(this.context, this._exit), this._parent &&= (this._parent._children?.delete(this), void 0), this._observers !== void 0) {
			let e = this._observers;
			this._observers = void 0;
			for (let n = 0; n < e.length; n++) e[n](t);
		}
		this._stack.length = 0, this._children = void 0, this.context = Is();
	}
	runLoop(e) {
		let t = globalThis[Ta];
		globalThis[Ta] = this;
		let n = this._running;
		this._running = !0;
		let r = !1, i = e;
		this.currentOpCount = 0;
		try {
			for (;;) {
				this._deferredInterrupt && (this._deferredInterrupt = !1, i = Ql(this._interruptedCause)), this.currentOpCount++;
				let e = this.cache;
				if (!r && !e.preventYield && e.scheduler.shouldYield(this)) {
					r = !0;
					let e = i;
					i = K(eu, () => e);
				}
				if (i = e.tracerContext ? e.tracerContext(i, this) : i[R](this), i === Qa) {
					let e = this._yielded;
					if (Ka in e) return this._deferredInterrupt = !1, this._yielded = void 0, e;
					if (this._deferredInterrupt) {
						this._yielded = void 0, e();
						continue;
					}
					return Qa;
				}
			}
		} catch (e) {
			return F(i, R) ? this.runLoop(Oo(e)) : Oo(`Fiber.runLoop: Not a valid effect: ${String(i)}`);
		} finally {
			this._running = n, globalThis[Ta] = t;
		}
	}
	getCont(e) {
		if (this._deferredInterrupt) return this._deferredInterrupt = !1, Hl;
		for (;;) {
			let t = this._stack.pop();
			if (!t) return;
			let n = t[Za];
			if (n !== void 0) {
				let r = n.call(t, this);
				if (r) return r[e] = r, r;
			}
			if (t[e]) return t;
		}
	}
	succeedWith(e) {
		if (!(++this.currentOpCount & Ul - 1)) return z(e);
		let t = this.getCont(Ya);
		return t ? t[Ya](e, this) : this.yieldWith(z(e));
	}
	yieldWith(e) {
		return this._yielded = e, Qa;
	}
	children() {
		return this._children ??= /* @__PURE__ */ new Set();
	}
	pipe() {
		return _i(this, arguments);
	}
	setContext(e) {
		let t = this.context;
		if (this.context = e, t !== void 0 && Ns(t, e)) return;
		let n = e.cacheRoot, r = n._fiberCache ??= Vl(e);
		this.cache?.scheduler !== r.scheduler && (this._dispatcher = void 0), this.cache = r;
	}
	get currentSpanLocal() {
		let e = this.cache.span;
		return e?._tag === "Span" ? e : void 0;
	}
}, Vl = (e) => {
	let t = Hs(e, hl);
	return {
		scheduler: Ws(e, Jc),
		tracer: t,
		tracerContext: t ? t.context : void 0,
		tracerEnabled: Ws(e, bl),
		span: Hs(e, ll),
		logLevel: Ws(e, wl),
		minimumLogLevel: Ws(e, Tl),
		stackFrame: Ws(e, yl),
		runtimeMetrics: Hs(e, vl),
		maxOpsBeforeYield: Ws(e, tl),
		preventYield: Ws(e, nl)
	};
}, Hl = {
	[Ya](e, t) {
		return Ql(t._interruptedCause);
	},
	[Xa](e, t) {
		return Ql(t._interruptedCause);
	}
}, Ul = 32, Wl = { interruptChildren: void 0 }, Gl = (e) => {
	if (!e.cache.stackFrame) return;
	let t = /* @__PURE__ */ new Map();
	return t.set(To.key, e.cache.stackFrame), js(t);
}, Kl = (e) => {
	let t = e;
	return t._exit ? H(t._exit) : cu((n) => t._exit ? n(H(t._exit)) : U(e.addObserver((e) => n(H(e)))));
}, ql = (e) => cu((t) => {
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
		t(H(r));
	}
	return a(), U(() => i?.());
}), Jl = (e) => {
	let t = e;
	return t._exit ? t._exit : cu((n) => t._exit ? n(t._exit) : U(e.addObserver(n)));
}, Yl = (e) => B((t) => Xl(e, t.id)), Xl = /*#__PURE__*/ N((e) => F(e[0], Il), (e, t, n) => B((r) => {
	let i = Gl(r);
	return i = i && n ? Js(i, n) : i ?? n, e.interruptUnsafe(t, i), Nu(Kl(e));
})), Zl = (e) => B((t) => {
	let n = Gl(t), r = dc();
	for (let i of e) i.interruptUnsafe(t.id, n), r.push(i);
	return Nu(ql(r));
}), H = z, Ql = Eo, $l = Do, U = /*#__PURE__*/ So({
	op: "Sync",
	[R](e) {
		let t = this[L](), n = e.getCont(Ya);
		return n ? n[Ya](t, e) : e.yieldWith(z(t));
	}
}), W = /*#__PURE__*/ So({
	op: "Suspend",
	[R](e) {
		return this[L]();
	}
}), eu = /*#__PURE__*/ (/* @__PURE__ */ So({
	op: "Yield",
	[R](e) {
		let t = !1;
		return e.currentDispatcher.scheduleTask(() => {
			t || e.evaluate(Uu);
		}, this[L] ?? 0), e.yieldWith(() => {
			t = !0;
		});
	}
}))(0), tu = /*#__PURE__*/ H(/*#__PURE__*/ fs()), nu = (e) => W(() => Ql(e())), ru = (e) => Oo(e), iu = (e) => W(() => $l(e())), G = /*#__PURE__*/ H(void 0), au = (e) => B((t) => e(t.id)), ou = /*#__PURE__*/ function() {
	let e = /*#__PURE__*/ xo({
		op: "Async",
		[R](e) {
			let t = !1, n = !1, r = this.withSignal ? new AbortController() : void 0, i = this.register.call(e.cache.scheduler, (r) => {
				t || (t = !0, n ? e.evaluate(r) : n = r);
			}, r?.signal);
			return n === !1 ? (n = !0, e._yielded = () => {
				t = !0;
			}, r === void 0 && i === void 0 || e._stack.push(su(() => (t = !0, r?.abort(), i ?? Uu))), Qa) : n;
		}
	}), t = function(e, t) {
		this.register = e, this.withSignal = t;
	};
	return t.prototype = e, function(e, n) {
		return new t(e, n);
	};
}(), su = /*#__PURE__*/ So({
	op: "AsyncFinalizer",
	[Za](e) {
		e.interruptible && (e.interruptible = !1, e._stack.push(Gd));
	},
	[Xa](e, t) {
		return Al(e) ? K(Sd(Eo(e), this[L]()), () => Ql(e)) : Ql(e);
	}
}), cu = (e) => ou(e, e.length >= 2), lu = /*#__PURE__*/ cu(wi), uu = (...e) => {
	if (e.length === 1) {
		let t = e[0];
		return W(() => vu(t()));
	}
	let [t, n] = e;
	return W(() => vu(n.call(t.self)));
}, du = (e, ...t) => {
	let n = t.length === 0 ? function() {
		return W(() => vu(e.apply(this, arguments)));
	} : function() {
		let n = W(() => vu(e.apply(this, arguments)));
		for (let e = 0; e < t.length; e++) n = t[e](n, ...arguments);
		return n;
	};
	return fu(e.length, n);
}, fu = (e, t) => Object.defineProperty(t, "length", {
	value: e,
	configurable: !0
}), pu = /*#__PURE__*/ El(2), mu = function() {
	let e = typeof arguments[0] == "string", t = e ? arguments[0] : "Effect.fn", n = e ? arguments[1] : void 0, r = za(), i;
	return r !== 0 && (Ba(2), i = new globalThis.Error(), Ba(r)), e ? (r, ...a) => hu(t, r, i, a, e, n) : hu(t, arguments[0], i, Array.prototype.slice.call(arguments, 1), e, n);
}, hu = (e, t, n, r, i, a) => {
	let o = typeof t == "function" ? t : r.shift().bind(t.self), s = `${e} (definition)`, c = n ? pu(() => n.stack) : Ci;
	return fu(o.length, function(...t) {
		let n = W(() => {
			let e = o.apply(this, arguments);
			return to(e) ? e : vu(e);
		});
		for (let e = 0; e < r.length; e++) n = r[e](n, ...t);
		if (!to(n)) return n;
		let l = za(), u;
		return l !== 0 && (Ba(2), u = new globalThis.Error(), Ba(l)), Ju(i ? Tf(e, a, (e) => Ef(n, e)) : n, yl, (t) => ({
			name: e,
			stack: u ? pu(() => u.stack) : Ci,
			parent: {
				name: s,
				stack: c,
				parent: t
			}
		}));
	});
}, gu = (e, ...t) => fu(e.length, t.length === 0 ? function() {
	return _u(() => e.apply(this, arguments));
} : function() {
	let n = _u(() => e.apply(this, arguments));
	for (let e of t) n = e(n, ...arguments);
	return n;
}), _u = (e) => {
	try {
		let t = e(), n;
		for (;;) {
			let r = t.next(n);
			if (r.done) return H(r.value);
			let i = r.value;
			if (i && i._tag === "Success") {
				n = i.value;
				continue;
			}
			if (i && i._tag === "Failure") return r.value;
			{
				let n = !0;
				return W(() => n ? (n = !1, K(r.value, (e) => vu(t, e))) : W(() => vu(e())));
			}
		}
	} catch (e) {
		return ru(e);
	}
}, vu = /*#__PURE__*/ function() {
	let e = /*#__PURE__*/ xo({
		op: "Iterator",
		[Ya](e, t) {
			let n = this.iterator;
			for (;;) {
				let r = n.next(e);
				if (r.done) return H(r.value);
				if (!q(r.value)) return t._stack.push(this), r.value;
				if (r.value._tag === "Failure") return r.value;
				e = r.value.value;
			}
		},
		[R](e) {
			return this[Ya](this.initial, e);
		}
	}), t = function(e, t) {
		this.iterator = e, this.initial = t;
	};
	return t.prototype = e, function(e, n) {
		return new t(e, n);
	};
}(), yu = /*#__PURE__*/ N(2, (e, t) => new Su(e, Cu, H(t))), bu = function(e) {
	return e._stack.push(this), this[L];
}, xu = /*#__PURE__*/ xo({
	op: "OnSuccess",
	[R]: bu
}), Su = function(e, t, n) {
	this[L] = e, this[Ya] = t, this.payload = n;
};
Su.prototype = xu;
var Cu = function() {
	return this.payload;
}, wu = function(e, t) {
	return t.succeedWith(this.payload);
}, Tu = /*#__PURE__*/ (() => {
	let e = "~effect/Effect/stackProbe";
	return { [e]: function() {
		return (/* @__PURE__ */ Error()).stack;
	} }[e]()?.includes("[as " + e + "]") === !0;
})(), Eu = function(e, t) {
	let n = this.payload;
	return t.succeedWith(Tu ? n(e) : Ha(() => n(e)));
}, Du = function(e) {
	let t = this.payload;
	return t(e);
}, Ou = function(e) {
	let t = this.payload;
	return new Su(t(e), wu, e);
}, ku = function(e) {
	return new Su(this.payload, wu, e);
}, Au = (e) => Ru(e, ps), ju = /*#__PURE__*/ N(2, (e, t) => new Su(e, to(t) ? Cu : Du, t)), Mu = /*#__PURE__*/ N(2, (e, t) => new Su(e, to(t) ? ku : Ou, t)), Nu = (e) => new Su(e, Cu, Uu), Pu = (e, t) => B((n) => {
	let r = /* @__PURE__ */ new Set();
	return Id(n, () => r.size === 0 ? void 0 : Zl(r)), cu((i) => {
		let a = !1, o = 0;
		for (let s of e) {
			if (a) break;
			let e = o++, c = of(n, s, !0, !0, !1);
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
}), Fu = /*#__PURE__*/ N((e) => to(e[1]), (e, t, n) => Pu([e, t], n)), K = /*#__PURE__*/ N(2, (e, t) => new Su(e, Du, t)), q = (e) => e[Ka] !== void 0, Iu = /*#__PURE__*/ N(2, (e, t) => q(e) ? e._tag === "Success" ? t(e.value) : e : K(e, t)), Lu = (e) => K(e, P), Ru = /*#__PURE__*/ N(2, (e, t) => new Su(e, Eu, t)), zu = /*#__PURE__*/ N(2, (e, t) => q(e) ? Wu(e, t) : Ru(e, t)), Bu = (e) => Eo(Ol(e)), Vu = (e) => e._tag === "Success", Hu = (e) => e._tag === "Failure" ? $s(e.cause) : ec(e), Uu = /*#__PURE__*/ z(void 0), Wu = /*#__PURE__*/ N(2, (e, t) => e._tag === "Success" ? z(t(e.value)) : e), Gu = /*#__PURE__*/ N(2, (e, t) => Vu(e) ? t : e), Ku = (e) => {
	let t = [];
	for (let n of e) n._tag === "Failure" && t.push(...n.cause.reasons);
	return t.length === 0 ? Uu : Eo(fo(t));
}, qu = /*#__PURE__*/ N(2, (e, t) => B((n) => {
	let r = n.context, i = t(r);
	return r === i ? e : (n.setContext(i), Id(n, () => {
		n.setContext(r);
	}), e);
})), Ju = /*#__PURE__*/ N(3, (e, t, n) => qu(e, (e) => {
	let r = Us(e, t), i = n(r);
	return r === i ? e : zs(e, t, i);
})), Yu = () => Xu, Xu = /*#__PURE__*/ B((e) => H(e.context)), Zu = (e) => B((t) => e(t.context)), Qu = /*#__PURE__*/ N(2, (e, t) => q(e) ? e : qu(e, Js(t))), $u = function() {
	return arguments.length === 1 ? N(2, (e, t) => ed(e, arguments[0], t)) : N(3, (e, t, n) => ed(e, t, n)).apply(this, arguments);
}, ed = (e, t, n) => qu(e, zs(t, n)), td = /*#__PURE__*/ N(2, (e, t) => K(t, (t) => t ? Au(e) : tu)), nd = /*#__PURE__*/ N((e) => to(e[0]), (e, t) => Zd({
	while: xi,
	body: bi(t?.disableYield ? e : K(e, (e) => eu)),
	step: wi
})), rd = /*#__PURE__*/ N(2, (e, t) => new ad(e, t.length === 1 ? t : (e) => t(e))), id = /*#__PURE__*/ xo({
	op: "OnFailure",
	[R]: bu
}), ad = function(e, t) {
	this[L] = e, this[Xa] = t;
};
ad.prototype = id;
var od = /*#__PURE__*/ N(3, (e, t, n) => rd(e, (e) => {
	let r = t(e);
	return nc(r) ? Ql(r.failure) : n(r.success, e);
})), sd = /*#__PURE__*/ N(2, (e, t) => od(e, kl, (e) => t(e))), cd = /*#__PURE__*/ N((e) => to(e[0]), (e, t, n, r) => rd(e, (e) => {
	let i = kl(e);
	return nc(i) ? Ql(i.failure) : t(i.success) ? n(i.success) : r ? r(i.success) : Ql(e);
})), ld = /*#__PURE__*/ N((e) => to(e[0]), (e, t, n, r) => cd(e, Array.isArray(t) ? (e) => F(e, "_tag") && t.includes(e._tag) : Bi(t), n, r)), ud = /*#__PURE__*/ N(2, (e, t) => sd(e, (e) => iu(() => t(e)))), dd = /*#__PURE__*/ N(2, (e, t) => new pd(e, t.onSuccess.length === 1 ? t.onSuccess : (e) => t.onSuccess(e), t.onFailure.length === 1 ? t.onFailure : (e) => t.onFailure(e))), fd = /*#__PURE__*/ xo({
	op: "OnSuccessAndFailure",
	[R]: bu
}), pd = function(e, t, n) {
	this[L] = e, this[Ya] = t, this[Xa] = n;
};
pd.prototype = fd;
var md = (e) => q(e) ? z(e) : hd(e), hd = /*#__PURE__*/ So({
	op: "Exit",
	[R](e) {
		return e._stack.push(this), this[L];
	},
	[Ya](e, t, n) {
		return t.succeedWith(n ?? z(e));
	},
	[Xa](e, t, n) {
		return t.succeedWith(n ?? Eo(e));
	}
}), gd = "~effect/Scope", _d = "~effect/Scope/Closeable", vd = /*#__PURE__*/ vs("effect/Scope"), yd = (e, t) => B((n) => {
	let r = bd(e, t);
	return r === void 0 ? G : (Jd(n), r);
}), bd = (e, t) => {
	let n = e.state;
	if (n._tag === "Closed" || (e.state = {
		_tag: "Closed",
		exit: t
	}, e.parent !== void 0 && Od(e.parent, e), n._tag === "Empty")) return;
	if (n.finalizer !== void 0) return xd(n.finalizer, t);
	let r = n.finalizers;
	return r.size === 1 ? xd(r.values().next().value, t) : Cd(e, r, t);
}, xd = (e, t) => {
	try {
		return e(t);
	} catch (e) {
		return Oo(e);
	}
}, Sd = (e, t) => Vu(e) ? t : rd(t, (t) => Ql(Nl(e.cause, t))), Cd = /*#__PURE__*/ du(function* (e, t, n) {
	let r = [], i = [], a = Array.from(t.values()), o = zl();
	for (let t = a.length - 1; t >= 0; t--) {
		let s = a[t];
		e.strategy === "sequential" ? r.push(yield* md(xd(s, n))) : i.push(of(o, xd(s, n), !0, !0, "inherit"));
	}
	return i.length > 0 && (r = yield* ql(i)), yield* Ku(r);
}), wd = (e, t) => {
	let n = Ad(t, e);
	return e.state._tag === "Closed" ? (n.state = e.state, n) : (Dd(e, n, (e) => yd(n, e)), n);
}, Td = (e, t) => W(() => e.state._tag === "Closed" ? t(e.state.exit) : (Dd(e, {}, t), G)), Ed = (e, t) => Td(e, bi(t)), Dd = (e, t, n) => {
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
}, Od = (e, t) => {
	if (e.state._tag !== "Open") return;
	let n = e.state;
	n.finalizerKey === t ? e.state = jd : n.finalizers !== void 0 && (n.finalizers.delete(t), n.finalizers.size === 0 && (e.state = jd));
}, kd = (e) => Ad(e, void 0), Ad = (e = "sequential", t) => ({
	[_d]: _d,
	[gd]: gd,
	strategy: e,
	parent: t,
	state: jd
}), jd = { _tag: "Empty" }, Md = /*#__PURE__*/ $u(vd), Nd = (e) => W(() => {
	let t = kd();
	return Ld(e(t), (e) => W(() => bd(t, e) ?? G));
}), Pd = /*#__PURE__*/ function() {
	let e = /*#__PURE__*/ xo({
		op: "OnExit",
		[R](e) {
			return e._stack.push(this), this.effect;
		},
		[Za](e) {
			e.interruptible && this.interruptible !== !0 && (e._stack.push(Gd), e.interruptible = !1);
		},
		[Ya](e, t, n) {
			n ??= z(e);
			let r;
			try {
				r = this.onExit(n);
			} catch (e) {
				r = Oo(e);
			}
			return r ? K(r, (e) => n) : n;
		},
		[Xa](e, t, n) {
			n ??= Eo(e);
			let r;
			try {
				r = this.onExit(n);
			} catch (e) {
				r = Oo(e);
			}
			return r ? K(Sd(n, r), (e) => n) : n;
		}
	}), t = function(e, t, n) {
		this.effect = e, this.onExit = t, this.interruptible = n;
	};
	return t.prototype = e, t;
}(), Fd = (e, t, n) => new Pd(e, t, n), Id = (e, t) => {
	e._stack.push(new Pd(void 0, t, void 0));
}, Ld = /*#__PURE__*/ N(2, Fd), Rd = /*#__PURE__*/ N(3, (e, t, n) => Ld(e, (e) => {
	let r = t(e);
	return nc(r) ? G : n(r.success, e);
})), zd = /*#__PURE__*/ N(2, (e, t) => Rd(e, Hu, t)), Bd = /*#__PURE__*/ N(3, (e, t, n) => Ld(e, (e) => {
	if (e._tag !== "Failure") return G;
	let r = t(e.cause);
	return nc(r) ? G : n(r.success, e.cause);
})), Vd = /*#__PURE__*/ N(2, (e, t) => Bd(jl, t)(e)), Hd = /*#__PURE__*/ B((e) => Ql(Ol(e.id))), Ud = (e) => B((t) => t.interruptible ? (t.interruptible = !1, t._stack.push(Gd), e) : e), Wd = /*#__PURE__*/ So({
	op: "SetInterruptible",
	[Za](e) {
		if (e.interruptible = this[L], e._interruptedCause && e.interruptible) return () => Ql(e._interruptedCause);
	}
}), Gd = /*#__PURE__*/ Wd(!0), Kd = /*#__PURE__*/ Wd(!1), qd = (e) => {
	if (e.interruptible = !0, e._stack.push(Kd), e._interruptedCause) return Ql(e._interruptedCause);
}, Jd = (e) => {
	let t = e;
	t.interruptible && (t.interruptible = !1, t._stack.push(Gd));
}, Yd = (e) => B((t) => t.interruptible ? e : qd(t) ?? e), Xd = (e) => B((t) => t.interruptible ? (t.interruptible = !1, t._stack.push(Gd), e(Yd)) : e(P)), Zd = /*#__PURE__*/ So({
	op: "While",
	[Ya](e, t) {
		return this[L].step(e), this[L].while() ? (t._stack.push(this), this[L].body()) : Uu;
	},
	[R](e) {
		return this[L].while() ? (e._stack.push(this), this[L].body()) : Uu;
	}
}), Qd = /*#__PURE__*/ N((e) => typeof e[1] == "function", (e, t, n) => W(() => {
	let r = ef(n?.concurrency);
	if (r === 1) return $d(e, t, n);
	let i = oc(e), a = i.length;
	if (a === 0) return n?.discard ? G : H([]);
	let o = n?.discard ? void 0 : Array(a), s = af({
		f: t,
		out: o
	}, i, { concurrency: r });
	return s ? yu(s, o) : H(o);
})), $d = (e, t, n) => W(() => {
	let r = n?.discard ? void 0 : [], i = e[Symbol.iterator](), a = i.next(), o = 0;
	return yu(Zd({
		while: () => !a.done,
		body: () => t(a.value, o++),
		step: (e) => {
			r && r.push(e), a = i.next();
		}
	}), r);
}), ef = (e) => e === "unbounded" ? Infinity : Math.max(1, e ?? 1), tf = () => (e) => {
	let t = e.onItem, n = e.step, r = (e, t, r, a, o) => K(md(o), (o) => n(e, t[r], o, r) ?? i(e, t, r + 1, a) ?? G), i = (e, i, a = 0, o = i.length) => {
		for (; a < o; a++) {
			let s = i[a], c = t(e, s, a);
			if (!q(c)) return r(e, i, a, o, c);
			let l = n(e, s, c, a);
			if (l) return l._tag === "Failure" ? l : void 0;
		}
	};
	return i;
}, nf = (e) => {
	let t = e.onItem, n = e.step;
	return (e, r, i) => {
		let a = 0, o = i.end ?? r.length, s = i.concurrency, c = !1, l, u, d, f, p, m = (e) => {
			let t = Oo(e);
			return f = t, c = !0, u && u.size > 0 ? K(Ud(Zl(Array.from(u))), () => f ?? t) : t;
		}, h = () => {
			let i = !1;
			for (; !f && a < o; a++) {
				let o = r[a], g = p ?? t(e, o, a);
				if (q(g)) {
					if (f = n(e, o, g, a), f) break;
				} else if (l) {
					p = void 0;
					let t = of(l, g, !0, !0, "inherit");
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
										let t = fo(e);
										f = Eo(f._tag === "Failure" ? Nl(f.cause, t) : t);
									}
								}
							} else {
								let t = n(e, o, a, r);
								t && (f = t, h());
							}
							if (i) {
								let e = h();
								e && d(e);
							} else c && u.size === 0 && d(f ?? G);
						} catch (e) {
							d(m(e));
						}
					}), u.size < s) continue;
					i = !0, a++;
					return;
				} else return cu((e) => {
					l = zl(), u = /* @__PURE__ */ new Set(), p = g, d = e;
					let t;
					try {
						t = h();
					} catch (t) {
						return e(m(t));
					}
					return t ? e(t) : W(() => (f ??= Uu, K(u ? Zl(u) : G, () => f?._tag === "Failure" ? f : G)));
				});
			}
			if (c = !0, f) {
				if (u && u.size > 0) {
					let e = Gl(l);
					u.forEach((t) => t.interruptUnsafe(l.id, e));
					return;
				}
				if (d || f._tag === "Failure") return f;
			} else if (d) {
				if (u) u.size === 0 && d(G);
				else return Uu;
			}
		};
		return h();
	};
}, rf = () => (e) => nf(e), af = /*#__PURE__*/ nf({
	onItem(e, t, n) {
		return e.f(t, n);
	},
	step(e, t, n, r) {
		if (n._tag === "Failure") return n;
		e.out && (e.out[r] = n.value);
	}
}), of = (e, t, n = !1, r = !1, i = !1) => {
	let a = e, o = i === "inherit" ? a.interruptible : !i, s = new Bl(a.context, o);
	return n ? s.evaluate(t) : a.currentDispatcher.scheduleTask(() => s.evaluate(t), 0), !r && !s._exit && (a.children().add(s), s._parent = a), s;
}, sf = /*#__PURE__*/ N((e) => to(e[0]), (e, t) => B((n) => H(of(n, e, t?.startImmediately, !0, t?.uninterruptible)))), cf = /*#__PURE__*/ N((e) => to(e[0]), (e, t, n) => B((r) => {
	let i = of(r, e, n?.startImmediately, !0, n?.uninterruptible);
	if (!i._exit) {
		if (t.state._tag !== "Closed") {
			let e = {};
			Dd(t, e, () => au((e) => e === i.id ? G : Yl(i))), i.addObserver(() => Od(t, e));
		} else i.interruptUnsafe(r.id, Gl(r));
	}
	return H(i);
})), lf = (e) => (t, n) => {
	let r = new Bl(n?.scheduler ? zs(e, Jc, n.scheduler) : e, n?.uninterruptible !== !0);
	if (r.evaluate(t), r._exit) return r;
	if (n?.signal) {
		if (n.signal.aborted) r.interruptUnsafe();
		else {
			let e = () => r.interruptUnsafe();
			n.signal.addEventListener("abort", e, { once: !0 }), r.addObserver(() => n.signal.removeEventListener("abort", e));
		}
	}
	return n?.onFiberStart && n.onFiberStart(r), r;
}, uf = /*#__PURE__*/ N(2, (e, t) => {
	if (e._exit) return e;
	if (t.state._tag === "Closed") return e.interruptUnsafe(e.id), e;
	let n = {};
	return Dd(t, n, () => Yl(e)), e.addObserver(() => Od(t, n)), e;
}), df = /*#__PURE__*/ lf(/*#__PURE__*/ Is()), ff = (e) => {
	let t = lf(e);
	return (e) => {
		if (q(e)) return e;
		let n = new $c("sync"), r = t(e, { scheduler: n });
		return r._dispatcher?.flush(), r._exit ?? Oo(new If(r));
	};
}, pf = /*#__PURE__*/ ff(/*#__PURE__*/ Is()), mf = /*#__PURE__*/ ((e) => {
	let t = ff(e);
	return (e) => {
		let n = t(e);
		if (n._tag === "Failure") throw Fl(n.cause);
		return n.value;
	};
})(/*#__PURE__*/ Is()), hf = /*#__PURE__*/ H(!0), gf = /*#__PURE__*/ H(!1), _f = class {
	waiters = [];
	scheduled = void 0;
	_isOpen;
	constructor(e) {
		this._isOpen = e;
	}
	scheduleUnsafe(e) {
		if (this.waiters.length === 0) return hf;
		if (this.scheduled === void 0) this.scheduled = this.waiters, e.currentDispatcher.scheduleTask(this.flushScheduled, 0);
		else for (let e = 0; e < this.waiters.length; e++) this.scheduled.push(this.waiters[e]);
		return this.waiters = [], hf;
	}
	flushScheduled = () => {
		if (this.scheduled === void 0) return;
		let e = this.scheduled;
		this.scheduled = void 0;
		for (let t = 0; t < e.length; t++) e[t](Uu);
	};
	flushWaiters() {
		let e = this.waiters;
		this.waiters = [], this.flushScheduled();
		for (let t = 0; t < e.length; t++) e[t](Uu);
	}
	open = /*#__PURE__*/ B((e) => this._isOpen ? gf : (this._isOpen = !0, this.scheduleUnsafe(e)));
	release = /*#__PURE__*/ B((e) => this._isOpen ? gf : this.scheduleUnsafe(e));
	openUnsafe() {
		return !this._isOpen && (this._isOpen = !0, this.flushWaiters(), !0);
	}
	await = /*#__PURE__*/ cu((e) => this._isOpen ? e(G) : (this.waiters.push(e), U(() => {
		let t = this.waiters.indexOf(e);
		t === -1 ? this.scheduled !== void 0 && (t = this.scheduled.indexOf(e), t !== -1 && this.scheduled.splice(t, 1)) : this.waiters.splice(t, 1);
	})));
	closeUnsafe() {
		return this._isOpen ? (this._isOpen = !1, !0) : !1;
	}
	close = /*#__PURE__*/ U(() => this.closeUnsafe());
	whenOpen = (e) => K(this.await, () => e);
	isOpen() {
		return this._isOpen;
	}
}, vf = (e) => new _f(e ?? !1), yf = /*#__PURE__*/ BigInt(0), bf = {
	_tag: "Span",
	spanId: "noop",
	traceId: "noop",
	sampled: !1,
	status: {
		_tag: "Ended",
		startTime: yf,
		endTime: yf,
		exit: Uu
	},
	attributes: /*#__PURE__*/ new Map(),
	links: [],
	kind: "internal",
	attribute() {},
	event() {},
	end() {},
	addLinks() {}
}, xf = (e) => Object.assign(Object.create(bf), e), Sf = (e) => e ? Ws(e.annotations, fl) ? e._tag === "Span" ? Sf(gs(e.parent)) : fs() : ps(e) : fs(), Cf = (e, t, n) => {
	let r = !e.cache.tracerEnabled || n?.annotations && Ws(n.annotations, fl), i = n?.parent === void 0 ? n?.root ? fs() : Sf(e.cache.span) : ps(n.parent), a;
	if (r) a = xf({
		name: t,
		parent: i,
		annotations: zs(n?.annotations ?? Is(), fl, !0)
	});
	else {
		let r = e.cache.tracer ?? gl, o = e.getRef(Df), s = e.getRef(xl), c = e.getRef(Sl), l = e.getRef(Cl), u = n?.level ?? e.getRef(pl), d = n?.links === void 0 ? l.length === 0 ? [] : l.slice() : [...l, ...n.links];
		a = r.span({
			name: t,
			parent: i,
			annotations: n?.annotations ?? Is(),
			links: d,
			startTime: s ? o.currentTimeNanosUnsafe() : yf,
			kind: n?.kind ?? "internal",
			root: n?.root ?? ms(i),
			sampled: n?.sampled ?? (hs(i) && i.value.sampled === !1 ? !1 : !Rf(e.getRef(ml), u))
		});
		for (let e in c) a.attribute(e, c[e]);
		if (n?.attributes !== void 0) for (let e in n.attributes) a.attribute(e, n.attributes[e]);
	}
	return a;
}, wf = (e, t, n, r) => U(() => {
	e.status._tag !== "Ended" && e.end(r ? n.currentTimeNanosUnsafe() : yf, t);
}), Tf = (e, ...t) => {
	let n = t.length === 1 ? void 0 : t[0], r = t[t.length - 1];
	return B((t) => {
		let i = Cf(t, e, n), a = t.getRef(Df), o = t.getRef(xl);
		return Id(t, (e) => wf(i, e, a, o)), r(i);
	});
}, Ef = /*#__PURE__*/ $u(ul), Df = /*#__PURE__*/ Xs("effect/Clock", { defaultValue: () => new kf() }), Of = 2 ** 31 - 1, kf = class {
	currentTimeMillisUnsafe() {
		return Date.now();
	}
	currentTimeMillis = /*#__PURE__*/ U(() => this.currentTimeMillisUnsafe());
	currentTimeNanosUnsafe() {
		return Mf();
	}
	currentTimeNanos = /*#__PURE__*/ U(() => this.currentTimeNanosUnsafe());
	monotonicTimeNanosUnsafe() {
		return jf();
	}
	monotonicTimeNanos = /*#__PURE__*/ U(() => this.monotonicTimeNanosUnsafe());
	sleep(e) {
		return this.sleepMillis(Hc(e));
	}
	sleepMillis(e) {
		return e <= 0 ? eu : Number.isFinite(e) ? cu((t) => {
			let n = e > Of ? this.sleepMillis(e - Of) : G, r = setTimeout(() => t(n), Math.min(e, Of));
			return U(() => clearTimeout(r));
		}) : lu;
	}
}, Af = /*#__PURE__*/ BigInt(1e6), jf = /*#__PURE__*/ function() {
	let e = globalThis.process?.hrtime;
	if (typeof e?.bigint == "function") return () => e.bigint();
	if (typeof performance < "u" && typeof performance.now == "function") return () => BigInt(Math.round(performance.now() * 1e6));
	let t = /*#__PURE__*/ BigInt(0);
	return () => {
		let e = BigInt(Date.now()) * Af;
		return e > t && (t = e), t;
	};
}(), Mf = /*#__PURE__*/ function() {
	let e = /*#__PURE__*/ BigInt(1e9), t;
	return () => {
		let n = jf(), r = BigInt(Date.now()) * Af;
		if (t === void 0) t = r - n;
		else {
			let i = t + n;
			(r > i ? r - i : i - r) > e && (t = r - n);
		}
		return t + n;
	};
}(), Nf = (e) => B((t) => e(t.getRef(Df))), Pf = (e) => Nf((t) => t.sleep(wc(e))), Ff = "~effect/Cause/AsyncFiberError", If = class extends (/*#__PURE__*/ jo("AsyncFiberError")) {
	[Ff] = Ff;
	constructor(e) {
		super({
			message: "An asynchronous Effect was executed with Effect.runSync",
			fiber: e
		});
	}
}, Lf = /*#__PURE__*/ Xs("effect/Console", { defaultValue: () => globalThis.console }), Rf = /*#__PURE__*/ ds(/* @__PURE__ */ us(ls, (e) => {
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
})), zf = {
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
zf.gray, zf.blue, zf.green, zf.yellow, zf.red, zf.bgBrightRed, zf.black;
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/Cause.js
var Bf = _o, Vf = fo, Hf = ho, Uf = Pl, Wf = No, Gf = Lo, Kf = z, qf = Eo, Jf = Do, Yf = Uu, Xf = Vu, Zf = {
	"~effect/Deferred": {
		_A: P,
		_E: P
	},
	pipe() {
		return _i(this, arguments);
	}
}, Qf = function() {
	this.resumes = void 0, this.effect = void 0;
};
Qf.prototype = Zf;
var $f = () => new Qf(), ep = (e) => cu((t) => e.effect ? t(e.effect) : (e.resumes ??= [], e.resumes.push(t), U(() => {
	let n = e.resumes;
	if (n === void 0) return;
	let r = n.indexOf(t);
	r >= 0 && n.splice(r, 1);
}))), tp = /* @__PURE__ */ N(2, (e, t) => U(() => ip(e, t))), np = /*#__PURE__*/ N(2, (e, t) => tp(e, Eo(t))), rp = /*#__PURE__*/ N(2, (e, t) => np(e, Ol(t))), ip = (e, t) => {
	if (e.effect) return !1;
	if (e.effect = t, e.resumes) {
		let n = e.resumes;
		e.resumes = void 0;
		for (let e = 0; e < n.length; e++) n[e](t);
	}
	return !0;
}, ap = vd, op = kd, sp = Md, cp = Td, lp = Ed, up = wd, dp = yd, fp = "~effect/Layer", pp = "~effect/Layer/MemoMap", mp = (e, t) => {
	let n = {
		observers: 0,
		deferred: $f(),
		scope: op(),
		finalizer: (r) => W(() => --n.observers > 0 ? G : (e.map.delete(t), dp(n.scope, r)))
	};
	return n;
}, hp = (e, t) => t.state._tag !== "Closed" && (e.observers++, Dd(t, {}, e.finalizer), !0), gp = {
	[fp]: {
		_ROut: P,
		_E: P,
		_RIn: P
	},
	pipe() {
		return _i(this, arguments);
	}
}, _p = (e) => {
	let t = Object.create(gp);
	return t.build = e, t;
}, vp = (e) => _p((t, n) => {
	let r = up(n);
	return Ld(e(t, r), (e) => e._tag === "Failure" ? dp(r, e) : G);
}), yp = class {
	get [pp]() {
		return pp;
	}
	parent;
	constructor(e) {
		this.parent = e;
	}
	map = /*#__PURE__*/ new Map();
	get(e, t) {
		let n = this.map.get(e);
		return n ? (hp(n, t), n.deferred.effect ?? ep(n.deferred)) : this.parent?.get(e, t);
	}
	getOrElseMemoize(e, t, n) {
		return W(() => {
			let r;
			return Fd(W(() => {
				let i = this.get(e, t);
				if (i) return i;
				let a = mp(this, e);
				return hp(a, t) ? (r = a.deferred, this.map.set(e, a), n(this, a.scope)) : n(this, t);
			}), (e) => {
				r && ip(r, e);
			});
		});
	}
}, bp = () => new yp(), xp = (e) => new yp(e), Sp = class e extends (/*#__PURE__*/ vs()("effect/Layer/CurrentMemoMap")) {
	static forkOrCreate(t) {
		let n = Vs(t, e);
		return n ? xp(n) : bp();
	}
}, Cp = /*#__PURE__*/ N(3, (e, t, n) => $u(Ru(e.build(t, n), zs(Sp, t)), Sp, t)), wp = /*#__PURE__*/ N(2, (e, t) => B((n) => Cp(e, Sp.forkOrCreate(n.context), t))), Tp = function() {
	return arguments.length === 1 ? (e) => Ep(Rs(arguments[0], e)) : Ep(Rs(arguments[0], arguments[1]));
}, Ep = (e) => _p(bi(H(e))), Dp = (e, t, n) => {
	let r = up(n, "parallel");
	return Qd(e, (e) => e.build(t, up(r, "sequential")), { concurrency: e.length }).pipe(Ru((e) => Ys(...e)));
}, Op = (...e) => vp((t, n) => Dp(e, t, n)), kp = Df, Ap = "~effect/DateTime", jp = "~effect/DateTime/TimeZone", Mp = {
	[Ap]: Ap,
	pipe() {
		return _i(this, arguments);
	},
	[Fa]() {
		return this.toString();
	},
	toJSON() {
		return Pp(this).toJSON();
	}
};
({ ...Mp }), { ...Mp };
var Np = {
	[jp]: jp,
	[Fa]() {
		return this.toString();
	}
};
({ ...Np }), { ...Np };
var Pp = (e) => new Date(e.epochMilliseconds), Fp = /*#__PURE__*/ N(2, (e, t) => od(e, zp, (e) => t(e))), Ip = (e) => e.reasons.some(Lp), Lp = (e) => e._tag === "Fail" && Wf(e.error), Rp = (e) => {
	let t, n = !1;
	for (let r of e.reasons) Lp(r) ? t ??= r.error : r._tag !== "Interrupt" && (n = !0);
	return t === void 0 ? ec(e) : n ? ec(Vf(e.reasons.filter((e) => !Lp(e)))) : $s(t);
}, zp = (e) => {
	let t = Rp(e);
	return nc(t) ? t : $s(t.success.value);
}, Bp = (e) => {
	let t = Rp(e);
	return nc(t) ? qf(t.failure) : Kf(t.success.value);
}, Vp = (e, t, n) => Nd((r) => K(n?.local ? Cp(t, bp(), r) : wp(t, r), (t) => Qu(e, t))), Hp = /*#__PURE__*/ N((e) => to(e[0]), (e, t, n) => Ps(t) ? Qu(e, t) : Vp(e, Array.isArray(t) ? Op(...t) : t, n)), Up = Qd, Wp = Zd, J = H, Gp = W, Y = U, Kp = G, qp = cu, Jp = uu, X = $l, Yp = Ql, Xp = nu, Zp = ru, Qp = B, Z = K, $p = Lu, em = ju, tm = Mu, nm = md, rm = Ru, im = yu, am = Nu, om = ld, sm = rd, cm = ud, lm = Pf, um = Fu, dm = td, fm = dd, pm = Yu, mm = Zu, hm = Hp, gm = $u, _m = zd, vm = Ld, ym = Hd, bm = Vd, xm = Ud, Sm = nd, Cm = cf, wm = sf, Tm = df, Em = lf, Dm = mf, Om = pf, km = du, Am = mu, jm = zu, Mm = Iu, Nm = gu, Pm = "~effect/BigDecimal", Fm = {
	[Pm]: Pm,
	[Vi]() {
		let e = Um(this);
		return Wi(Ji(String(e.value)), qi(e.scale));
	},
	[aa](e) {
		return Im(e) && Jm(this, e) === 0;
	},
	toString() {
		return `BigDecimal(${Xm(this)})`;
	},
	toJSON() {
		return {
			_id: "BigDecimal",
			value: String(this.value),
			scale: this.scale
		};
	},
	[Fa]() {
		return this.toJSON();
	},
	pipe() {
		return _i(this, arguments);
	}
}, Im = (e) => F(e, Pm), Lm = (e, t) => {
	if (!Number.isSafeInteger(t)) throw RangeError(`Scale must be a safe integer, got ${t}`);
	let n = Object.create(Fm);
	return n.value = e, n.scale = t, n;
}, Rm = (e, t) => {
	let n = Lm(e, t);
	return n.normalized = n, n;
}, zm = /*#__PURE__*/ BigInt(0), Bm = /*#__PURE__*/ BigInt(1), Vm = /*#__PURE__*/ BigInt(10), Hm = /*#__PURE__*/ Rm(zm, 0), Um = (e) => {
	if (e.normalized === void 0) {
		if (e.value === zm) e.normalized = Hm;
		else {
			let t = `${e.value}`, n = t.length;
			for (; t[n - 1] === "0";) n--;
			e.normalized = Rm(BigInt(t.slice(0, n)), e.scale - (t.length - n));
		}
	}
	return e.normalized;
}, Wm = 100, Gm = [Bm], Km = (e, t) => e === t ? 0 : e < t ? -1 : 1, qm = (e, t) => {
	let n = `${e.value < zm ? -e.value : e.value}`, r = `${t.value < zm ? -t.value : t.value}`, i = BigInt(n.length - r.length) - BigInt(e.scale) + BigInt(t.scale);
	if (i !== zm) return i < zm ? -1 : 1;
	let a = Math.max(n.length, r.length);
	return cs(n.padEnd(a, "0"), r.padEnd(a, "0"));
}, Jm = (e, t) => {
	if (e.scale === t.scale) return Km(e.value, t.value);
	let n = Ym(e), r = Ym(t);
	if (n !== r) return n < r ? -1 : 1;
	if (n === 0) return 0;
	let i = e.scale - t.scale, a = Math.abs(i);
	if (a > Wm) return n === -1 ? qm(t, e) : qm(e, t);
	let o = Gm[a] ??= Vm ** BigInt(a);
	return i > 0 ? Km(e.value, t.value * o) : Km(e.value * o, t.value);
}, Ym = (e) => e.value === zm ? 0 : e.value < zm ? -1 : 1, Xm = (e) => {
	let t = Um(e);
	if (Math.abs(t.scale) >= 16) return Zm(t);
	let n = t.value < zm, r = `${n ? -t.value : t.value}`, i = t.scale > 0 ? r.padStart(t.scale + 1, "0") : r.padEnd(r.length - t.scale, "0"), a = i.length - t.scale, o = t.scale > 0 ? `${i.slice(0, a)}.${i.slice(a)}` : i;
	return n ? `-${o}` : o;
}, Zm = (e) => {
	if (Qm(e)) return "0e+0";
	let t = Um(e), n = `${t.value}`, r = t.value < zm ? 2 : 1, i = n.slice(0, r), a = n.slice(r), o = a.length - t.scale;
	return `${i}${a === "" ? "" : `.${a}`}e${o >= 0 ? "+" : ""}${o}`;
}, Qm = (e) => e.value === zm, $m = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", eh = /*#__PURE__*/ (/* @__PURE__ */ new Uint8Array(123)).fill(255);
for (let e = 0; e < 64; e++) eh[/*#__PURE__*/ $m.charCodeAt(e)] = e;
eh[61] = 0, { ...La }, { ...La }, { ...$a };
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/internal/schema/annotations.js
function th(e) {
	return e.checks ? e.checks[e.checks.length - 1].annotations : e.annotations;
}
var nh = "~sentinels", rh = "~constructor", ih = /*#__PURE__*/ Ti((e) => {
	let t = th(e)?.identifier;
	return typeof t == "string" ? t : e.getExpected(ih);
}), Q = /*#__PURE__*/ Symbol(), ah = Kf, oh = /*#__PURE__*/ ah(Q), $ = /*#__PURE__*/ ah(Q), sh = (e) => e === Q ? fs() : ps(e), ch = (e) => e._tag === "None" ? oh : ah(e.value), lh = "~effect/SchemaIssue/Issue";
function uh(e) {
	return F(e, lh) && e[lh] === lh;
}
function dh(e) {
	return Object.hasOwn(e, "input");
}
var fh = class {
	[lh] = lh;
	constructor(e, t) {
		t?.reportInput === !0 && e !== Q && (this.input = e);
	}
}, ph = class extends fh {
	_tag = "Filter";
	filter;
	issue;
	constructor(e, t, n, r) {
		super(n, r), this.filter = e, this.issue = t;
	}
}, mh = class extends fh {
	_tag = "Encoding";
	ast;
	issue;
	constructor(e, t, n, r) {
		super(n, r), this.ast = e, this.issue = t;
	}
}, hh = class extends fh {
	_tag = "Pointer";
	path;
	issue;
	constructor(e, t) {
		super(), this.path = e, this.issue = t;
	}
}, gh = class extends fh {
	_tag = "MissingKey";
	annotations;
	constructor(e) {
		super(), this.annotations = e;
	}
}, _h = class extends fh {
	_tag = "UnexpectedKey";
	ast;
	constructor(e, t, n) {
		super(t, n), this.ast = e;
	}
}, vh = class extends fh {
	_tag = "Composite";
	ast;
	issues;
	constructor(e, t, n, r) {
		super(n, r), this.ast = e, this.issues = t;
	}
}, yh = class extends fh {
	_tag = "InvalidType";
	ast;
	constructor(e, t, n) {
		super(t, n), this.ast = e;
	}
}, bh = class extends fh {
	_tag = "InvalidValue";
	annotations;
	constructor(e, t, n) {
		super(t, n), this.annotations = e;
	}
}, xh = class extends fh {
	_tag = "AnyOf";
	ast;
	issues;
	constructor(e, t, n, r) {
		super(n, r), this.ast = e, this.issues = t;
	}
}, Sh = class extends fh {
	_tag = "OneOf";
	ast;
	successes;
	constructor(e, t, n, r) {
		super(n, r), this.ast = e, this.successes = t;
	}
};
function Ch(e, t, n) {
	if (uh(e)) return e;
	if (typeof e == "string") return new bh({ message: e }, t, n);
	let r = typeof e.issue == "string" ? new bh({ message: e.issue }, t, n) : e.issue;
	return new hh(e.path, r);
}
function wh(e, t, n) {
	if (e !== void 0) return typeof e == "boolean" ? e ? void 0 : new bh(void 0, t, n) : Ch(e, t, n);
}
function Th(e, t, n, r) {
	return Array.isArray(t) ? lc(t) ? t.length === 1 ? Ch(t[0], n, r) : new vh(e, pc(t, (e) => Ch(e, n, r)), n, r) : void 0 : wh(t, n, r);
}
var Eh = (e) => {
	let t = Fh(e);
	if (t !== void 0) return t;
	switch (e._tag) {
		case "InvalidType": return Ah(ih(e.ast), e);
		case "InvalidValue": {
			let t = kh(e);
			if (t !== void 0) return Ah(t, e);
			let n = Oh(e);
			return n === void 0 ? "Expected a valid value" : `Invalid data ${n}`;
		}
		case "MissingKey": return "Missing key";
		case "UnexpectedKey": {
			let t = Oh(e);
			return t === void 0 ? "Expected no excess property" : `Unexpected key with value ${t}`;
		}
		case "Forbidden": return "Forbidden operation";
		case "OneOf": {
			let t = Oh(e);
			return t === void 0 ? "Expected exactly one member to match" : `Expected exactly one member to match the input ${t}`;
		}
	}
}, Dh = (e) => Fh(e.issue) ?? Fh(e);
function Oh(e) {
	return dh(e) ? Oa(e.input) : void 0;
}
function kh(e) {
	let t = e.annotations?.expected;
	return typeof t == "string" ? t : void 0;
}
function Ah(e, t) {
	let n = Oh(t);
	return n === void 0 ? `Expected ${e}` : `Expected ${e}, got ${n}`;
}
function jh(e) {
	let t = e.annotations?.expected;
	if (typeof t == "string") return t;
	switch (e._tag) {
		case "Filter": return "<filter>";
		case "FilterGroup": return e.checks.map((e) => jh(e)).join(" & ");
	}
}
function Mh() {
	return (e) => Ph(e, "");
}
var Nh = /*#__PURE__*/ Mh();
function Ph(e, t) {
	let n;
	switch (e._tag) {
		case "Filter": {
			let r = Dh(e);
			if (r !== void 0) n = r;
			else {
				if (e.issue._tag !== "InvalidValue") return Ph(e.issue, t);
				let r = kh(e.issue);
				n = r === void 0 ? Ah(jh(e.filter), e) : Ah(r, e.issue);
			}
			break;
		}
		case "Encoding": return Ph(e.issue, t);
		case "Pointer": return Ph(e.issue, t + ja(e.path));
		case "Composite":
		case "AnyOf":
			if (e._tag === "Composite" || e.issues.length > 0) return e.issues.map((e) => Ph(e, t)).join("\n");
			n = Fh(e) ?? Ah(ih(e.ast), e);
			break;
		default: n = Eh(e);
	}
	return t ? `${n}\n  at ${t}` : n;
}
function Fh(e) {
	if (e._tag === "Pointer") return;
	if (e._tag === "Encoding") return Fh(e.issue);
	let t = (e._tag === "Filter" ? e.filter.annotations : "annotations" in e ? e.annotations : e.ast.annotations)?.[e._tag === "MissingKey" ? "messageMissingKey" : e._tag === "UnexpectedKey" ? "messageUnexpectedKey" : "message"];
	if (typeof t == "string") return t;
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/internal/schema/cause.js
function Ih(e) {
	let t;
	for (let n of e.reasons) {
		if (!Bf(n) || !uh(n.error)) return;
		t ??= n.error;
	}
	return t;
}
function Lh(e, t) {
	let n = Ih(e);
	if (n === void 0) throw Error(t, { cause: e });
	return n;
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/SchemaGetter.js
var Rh = (e) => Object.assign(Object.create(vi), e), zh = /*#__PURE__*/ Rh({ _tag: "Passthrough" });
function Bh() {
	return zh;
}
function Vh(e) {
	return Rh({
		_tag: "Transform",
		transform: e
	});
}
function Hh() {
	return Vh(globalThis.String);
}
function Uh() {
	return Vh(globalThis.Number);
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/SchemaTransformation.js
var Wh = class extends yi {
	_tag = "Middleware";
	decode;
	encode;
	constructor(e, t) {
		super(), this.decode = e, this.encode = t;
	}
	flip() {
		return new Wh(this.encode, this.decode);
	}
}, Gh = "~effect/SchemaTransformation/Transformation", Kh = class extends yi {
	[Gh] = Gh;
	_tag = "Transformation";
	decode;
	encode;
	constructor(e, t) {
		super(), this.decode = e, this.encode = t;
	}
	flip() {
		return new Kh(this.encode, this.decode);
	}
};
function qh(e) {
	return F(e, Gh) && e[Gh] === Gh;
}
var Jh = (e) => qh(e) ? e : new Kh(e.decode, e.encode), Yh = /*#__PURE__*/ new Kh(/*#__PURE__*/ Bh(), /*#__PURE__*/ Bh());
function Xh() {
	return Yh;
}
var Zh = /*#__PURE__*/ new Kh(/*#__PURE__*/ Uh(), /*#__PURE__*/ Hh());
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/SchemaAST.js
function Qh(e) {
	return (t) => t._tag === e;
}
var $h = /*#__PURE__*/ Qh("Declaration"), eg = /*#__PURE__*/ Qh("Never"), tg = /*#__PURE__*/ Qh("Literal"), ng = /*#__PURE__*/ Qh("UniqueSymbol"), rg = /*#__PURE__*/ Qh("Arrays"), ig = /*#__PURE__*/ Qh("Objects"), ag = /*#__PURE__*/ Qh("Suspend"), og = class {
	to;
	transformation;
	constructor(e, t) {
		this.to = e, this.transformation = t;
	}
}, sg = {}, cg = class {
	isOptional;
	isMutable;
	constructorDefault;
	annotations;
	constructor(e, t, n = void 0, r = void 0) {
		this.isOptional = e, this.isMutable = t, this.constructorDefault = n, this.annotations = r;
	}
}, lg = "~effect/Schema", ug = class {
	[lg] = lg;
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
}, dg = class extends ug {
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
		return (t, n) => t === Q ? oh : (e ??= this.run(this.typeParameters))(t, this, n);
	}
	_rebuild(e, t, n, r, i) {
		let a = T_(this.typeParameters, e);
		return a === this.typeParameters && t === this.checks && n === this.encodingChecks && r === this.run && i === this.encodingRun ? this : new dg(a, r, this.annotations, t, void 0, this.context, n, i);
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
}, fg = /*#__PURE__*/ new class extends ug {
	_tag = "Unknown";
	getParser() {
		return H_(this, Ri);
	}
	getExpected() {
		return "unknown";
	}
}(), pg = class extends ug {
	_tag = "Literal";
	literal;
	constructor(e, t, n, r, i) {
		if (super(t, n, r, i), typeof e == "number" && !globalThis.Number.isFinite(e)) throw Error(`A numeric literal must be finite, got ${Oa(e)}`);
		this.literal = e;
	}
	getParser() {
		return V_(this, this.literal);
	}
	matchPart(e, t) {
		return e === globalThis.String(this.literal) ? this.literal : void 0;
	}
	toCodecJson() {
		return typeof this.literal == "bigint" ? mg(this) : this;
	}
	toCodecStringTree() {
		return typeof this.literal == "string" ? this : mg(this);
	}
	getExpected() {
		return typeof this.literal == "string" ? JSON.stringify(this.literal) : globalThis.String(this.literal);
	}
};
function mg(e) {
	let t = globalThis.String(e.literal);
	return m_(e, [new og(new pg(t), new Kh(Vh(() => e.literal), Vh(() => t)))]);
}
var hg = /*#__PURE__*/ new class extends ug {
	_tag = "String";
	getParser() {
		return H_(this, Mi);
	}
	matchPart(e, t) {
		let n = this.checks;
		return n && !t.disableChecks && X_(n, e, void 0, this, t) ? void 0 : e;
	}
	getExpected() {
		return "string";
	}
}(), gg = class extends ug {
	_tag = "Number";
	getParser() {
		return H_(this, Ni);
	}
	matchKey(e, t) {
		return this._match(G_, e, t);
	}
	matchPart(e, t) {
		return this._match(W_, e, t);
	}
	_match(e, t, n) {
		if (!e.test(t)) return;
		let r = globalThis.Number(t);
		return n.disableChecks || !this.checks ? r : X_(this.checks, r, void 0, this, n) ? void 0 : r;
	}
	toCodecJson() {
		return this.checks && (_g(this.checks, "effect/schema/isFinite") || _g(this.checks, "effect/schema/isInt")) ? this : m_(this, [l_]);
	}
	toCodecStringTree() {
		return this.toCodecJson() === this ? m_(this, [J_]) : m_(this, [Y_]);
	}
	getExpected() {
		return "number";
	}
};
function _g(e, t) {
	return e.some((e) => e.annotations?.representation?.id === t || e._tag === "FilterGroup" && _g(e.checks, t));
}
var vg = /*#__PURE__*/ new gg(), yg = class extends ug {
	_tag = "Arrays";
	isMutable;
	elements;
	rest;
	encodingChecks;
	constructor(e, t, n, r, i, a, o, s) {
		super(r, i, a, o), this.isMutable = e, this.elements = t, this.rest = n, this.encodingChecks = s;
		let c = !1;
		for (let e = 0; e < t.length; e++) if (M_(t[e])) c = !0;
		else if (c) throw Error("A required element cannot follow an optional element. ts(1257)");
		if (c && n.length > 1) throw Error("A required element cannot follow an optional element. ts(1257)");
		for (let e = 1; e < n.length; e++) if (M_(n[e])) throw Error("An optional element cannot follow a rest element. ts(1266)");
	}
	getParser(e, t = e) {
		let n = this, r, i, a = n.elements.length, o = Math.max(0, n.rest.length - 1);
		function s(e, t) {
			return t < a ? r[t] : t >= e ? i[t - e + 1] : i[0];
		}
		let c = (e) => {
			let { input: t, len: r, options: i } = e;
			if (n.rest.length === 0 && r > a) for (let o = a; o < r; o++) {
				let r = new _h(n, t[o], i), a = new hh([o], r);
				if (i.errors === "all") e.issues ? e.issues.push(a) : e.issues = [a];
				else return X(new vh(n, [a], t, i));
			}
			return e.issues ? X(new vh(n, e.issues, t, i)) : ah(e.output);
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
			}, u = n.rest.length === 0 ? a : Math.max(r, a + o), d = t.concurrency === void 0 ? 1 : ef(t.concurrency), f = d === 1 ? Sg(i, e, 0, u) : Cg(i, e, {
				concurrency: d,
				end: u
			});
			if (!f) return c(i);
			if (q(f)) return Mm(f, () => c(i));
			let p = !0;
			return Gp(() => p ? (p = !1, Z(f, () => c(i))) : l(e, t));
		};
		return (e, a) => {
			if (e === Q) return oh;
			try {
				return Array.isArray(e) ? (r || (r = n.elements.map((e) => ({
					ast: e,
					parser: t(e)
				})), i = n.rest.map((e) => ({
					ast: e,
					parser: t(e)
				}))), l(e, a)) : X(new yh(n, e, a));
			} catch (e) {
				return Zp(e);
			}
		};
	}
	_rebuild(e, t, n) {
		let r = T_(this.elements, e), i = T_(this.rest, e);
		return r === this.elements && i === this.rest && t === this.checks && n === this.encodingChecks ? this : new yg(this.isMutable, r, i, this.annotations, t, void 0, this.context, n);
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
function bg(e, t, n, r) {
	if (n._tag === "Failure") return wg(e, e.ast, r, n);
	let i = n === $ ? t : n[L];
	if (i !== Q) e.output[r] = i;
	else {
		let t = e.getParser(e.tailThreshold, r);
		if (M_(t.ast)) return;
		let n = new hh([r], new gh(t.ast.context?.annotations));
		if (e.options.errors === "all") e.issues ? e.issues.push(n) : e.issues = [n];
		else return Jf(new vh(e.ast, [n], e.input, e.options));
	}
}
var xg = {
	onItem(e, t, n) {
		let r = n < e.len ? t : Q;
		return e.getParser(e.tailThreshold, n).parser(r, e.options);
	},
	step: bg
}, Sg = /*#__PURE__*/ tf()(xg), Cg = /*#__PURE__*/ rf()(xg), wg = (e, t, n, r) => {
	if (r.cause.reasons.length === 0) return r;
	let i = Ih(r.cause);
	if (i === void 0) return qf(Uf(r.cause, (r) => new vh(t, [new hh([n], r)], e.input, e.options)));
	let a = new hh([n], i);
	if (e.options.errors === "all") e.issues ? e.issues.push(a) : e.issues = [a];
	else return Jf(new vh(t, [a], e.input, e.options));
}, Tg = "[+-]?\\d*\\.?\\d+(?:[Ee][+-]?\\d+)?";
function Eg(e, t, n = sg) {
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
	return a(U_(L_(t)));
}
var Dg = class {
	name;
	type;
	constructor(e, t) {
		this.name = e, this.type = t;
	}
};
function Og(e) {
	switch (e._tag) {
		case "String":
		case "Number":
		case "Symbol":
		case "TemplateLiteral": return !0;
		case "Union": return e.types.every(Og);
		default: return !1;
	}
}
function kg(e) {
	let t = g_(e);
	switch (t._tag) {
		case "String":
		case "Number":
		case "Symbol":
		case "TemplateLiteral": return !0;
		case "Union": return t.types.every(kg);
		default: return !1;
	}
}
function Ag(e) {
	return Og(e) && kg(e);
}
var jg = class {
	parameter;
	type;
	constructor(e, t) {
		if (!Ag(e)) throw Error(`Invalid index signature parameter ${e._tag}`);
		if (this.parameter = e, this.type = t, M_(t) && !B_(t)) throw Error("Cannot use `Schema.optionalKey` with index signatures, use `Schema.optional` instead.");
	}
}, Mg = class extends ug {
	_tag = "Objects";
	propertySignatures;
	indexSignatures;
	encodingChecks;
	constructor(e, t, n, r, i, a, o) {
		super(n, r, i, a), this.propertySignatures = e, this.indexSignatures = t, this.encodingChecks = o;
	}
	getParser(e, t = e) {
		let n = this, r = n.propertySignatures.length, i = n.indexSignatures.length;
		if (!r && !i) return H_(n, Li);
		let a, o, s = () => (a || (a = n.propertySignatures.map((e) => ({
			parser: t(e.type),
			name: e.name,
			type: e.type
		})), o = i ? n.indexSignatures.map((n) => ({
			is: n,
			parserKey: e(U_(n.parameter)),
			parserValue: t(n.type)
		})) : void 0), a), c = () => {
			let e = new Set(n.propertySignatures.map((e) => typeof e.name == "number" ? globalThis.String(e.name) : e.name)), t = (t, i, a, o, s) => {
				if (s._tag === "Failure") return wg(t, n, i, s) ?? Yf;
				let c = s === $ ? o : s[L];
				if (a !== Q && c !== Q) {
					if (r && (e.has(i) || e.has(typeof a == "number" ? globalThis.String(a) : a))) return Yf;
					Ua(t.out, a, c);
				}
				return Yf;
			}, c = (e, r, i, a) => {
				if (!a) {
					let t = i.parserKey(r, e.options);
					if (!q(t)) return Z(nm(t), (t) => c(e, r, i, t));
					a = t;
				}
				if (a._tag === "Failure") return wg(e, n, r, a) ?? Yf;
				let o = a === $ ? r : a[L], s = e.input[r], l = i.parserValue(s, e.options);
				return q(l) ? t(e, r, o, s, l) : Z(nm(l), (n) => t(e, r, o, s, n));
			}, l = (e, n, r) => {
				let i = e.input[n], a = r.parserValue(i, e.options);
				return q(a) ? t(e, n, n, i, a) : Z(nm(a), (r) => t(e, n, n, i, r));
			}, u = i ? rf()({
				onItem: (e, [t, n]) => n.is.parameter === hg ? l(e, t, n) : c(e, t, n),
				step: (e, t, n) => n._tag === "Failure" ? n : void 0
			}) : void 0;
			return Nm(function* (t, d) {
				if (t === Q) return Q;
				if (typeof t != "object" || !t || Array.isArray(t)) return yield* X(new yh(n, t, d));
				s();
				let f = t, p = {}, m = {
					ast: n,
					input: f,
					out: p,
					issues: void 0,
					options: d
				}, h = d.errors === "all", g = d.onExcessProperty === "error", _ = d.concurrency === void 0 ? 1 : ef(d.concurrency), ee = i && g ? n.indexSignatures.map((e) => Eg(f, e.parameter, d)) : void 0;
				if (g) {
					let r = ee ? new Set(e) : e;
					if (ee) for (let e of ee) for (let t of e) r.add(t);
					let i = Reflect.ownKeys(f);
					for (let e = 0; e < i.length; e++) {
						let a = i[e];
						if (!r.has(a) && Object.prototype.propertyIsEnumerable.call(f, a)) {
							let e = new _h(n, f[a], d), r = new hh([a], e);
							if (h) {
								m.issues ? m.issues.push(r) : m.issues = [r];
								continue;
							}
							return yield* X(new vh(n, [r], t, d));
						}
					}
				}
				if (r) {
					let e = _ === 1 ? Fg(m, a) : Ig(m, a, { concurrency: _ });
					e && (yield* e);
				}
				if (i && _ === 1) for (let e = 0; e < i; e++) {
					let t = o[e], n = t.is.parameter === hg ? l : c, r = ee?.[e] ?? (t.is.parameter === hg ? Object.keys(f) : Eg(f, t.is.parameter, d));
					for (let e = 0; e < r.length; e++) {
						let i = n(m, r[e], t);
						if (!q(i)) yield* i;
						else if (i._tag === "Failure") return yield* i;
					}
				}
				else if (u) {
					let e = dc();
					for (let t = 0; t < i; t++) {
						let n = o[t], r = ee?.[t] ?? (n.is.parameter === hg ? Object.keys(f) : Eg(f, n.is.parameter, d));
						for (let t = 0; t < r.length; t++) e.push([r[t], n]);
					}
					let t = u(m, e, { concurrency: _ });
					t && (yield* t);
				}
				return m.issues ? yield* X(new vh(n, m.issues, t, d)) : p;
			});
		};
		if (i) return c();
		let l, u = (e, t, n) => {
			let r = a[t];
			return Z(nm(n), (n) => {
				let i = Ng(e, r, n);
				if (i) return i;
				let o = () => ah(e.out), s = Fg(e, a.slice(t + 1));
				return s ? Mm(s, o) : o();
			});
		};
		return (e, t) => {
			if (e === Q) return oh;
			if (t.errors === "all" || t.onExcessProperty !== void 0 || t.concurrency !== void 0 && ef(t.concurrency) !== 1) return (l ??= c())(e, t);
			if (typeof e != "object" || !e || Array.isArray(e)) return X(new yh(n, e, t));
			let r = s(), i = e, a = {}, o = {
				ast: n,
				input: i,
				out: a,
				issues: void 0,
				options: t
			};
			try {
				for (let e = 0; e < r.length; e++) {
					let n = r[e], s = n.name, c = qg(i, s), l = c ? i[s] : Q, d = n.parser(l, t);
					if (!q(d)) return u(o, e, d);
					if (d === $) {
						c && Ua(a, s, l);
						continue;
					}
					let f = Ng(o, n, d);
					if (f) return f;
				}
			} catch (e) {
				return Zp(e);
			}
			return ah(a);
		};
	}
	_rebuild(e, t, n, r) {
		let i = T_(this.propertySignatures, (t) => {
			let n = e(t.type);
			return n === t.type ? t : new Dg(t.name, n);
		}), a = T_(this.indexSignatures, (n) => {
			let r = t(n.parameter), i = e(n.type);
			return r === n.parameter && i === n.type ? n : new jg(r, i);
		});
		return i === this.propertySignatures && a === this.indexSignatures && n === this.checks && r === this.encodingChecks ? this : new Mg(i, a, this.annotations, n, void 0, this.context, r);
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
function Ng(e, t, n) {
	if (n._tag === "Failure") return wg(e, e.ast, t.name, n);
	if (n === $) return;
	let r = n[L];
	if (r !== Q) {
		Ua(e.out, t.name, r);
		return;
	}
	if (delete e.out[t.name], !M_(t.type)) {
		let n = new hh([t.name], new gh(t.type.context?.annotations));
		if (e.options.errors === "all") {
			e.issues ? e.issues.push(n) : e.issues = [n];
			return;
		}
		return Jf(new vh(e.ast, [n], e.input, e.options));
	}
}
var Pg = {
	onItem(e, t) {
		if (!qg(e.input, t.name)) return t.parser(Q, e.options);
		let n = e.input[t.name];
		return Ua(e.out, t.name, n), t.parser(n, e.options);
	},
	step: Ng
}, Fg = /*#__PURE__*/ tf()(Pg), Ig = /*#__PURE__*/ rf()(Pg);
function Lg(e, t) {
	return e ? t ? [...e, ...t] : e : t;
}
function Rg(e, t, n) {
	return new Mg(Reflect.ownKeys(e).map((t) => new Dg(t, e[t].ast)), [], n, t);
}
function zg(e) {
	return e.ast;
}
function Bg(e, t, n) {
	return new Yg(e.map(zg), t, void 0, n);
}
var Vg = /*#__PURE__*/ Ei((e) => {
	for (;;) {
		if (ag(e)) return fg;
		let t = e.encoding;
		if (!t) return e.recur?.(Vg, P) ?? e;
		if (t.some((e) => e.transformation._tag === "Middleware" && e.transformation.decode !== P)) return fg;
		e = t[t.length - 1].to;
	}
});
function Hg(e) {
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
		case "Union": return Array.from(new Set(e.types.flatMap(Hg)));
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
function Ug(e) {
	switch (e._tag) {
		default: return [];
		case "Declaration": {
			let t = e.annotations?.[nh];
			return Array.isArray(t) ? t : [];
		}
		case "Objects": return e.propertySignatures.flatMap((e) => {
			let t = e.type;
			if (!M_(t)) {
				if (tg(t)) return [{
					key: e.name,
					literal: t.literal
				}];
				if (ng(t)) return [{
					key: e.name,
					literal: t.symbol
				}];
			}
			return [];
		});
		case "Arrays": return e.elements.flatMap((e, t) => {
			if (!M_(e)) {
				if (tg(e)) return [{
					key: t,
					literal: e.literal
				}];
				if (ng(e)) return [{
					key: t,
					literal: e.symbol
				}];
			}
			return [];
		});
		case "Union": {
			if (e.types.length === 0) return [];
			let t = e.types.map((e) => Ug(Vg(e)));
			return t[0].filter((e) => t.every((t) => t.some((t) => t.key === e.key && t.literal === e.literal)));
		}
		case "Suspend": return Ug(e.thunk());
	}
}
var Wg = /*#__PURE__*/ new WeakMap(), Gg = /*#__PURE__*/ Object.freeze([]), Kg = (e) => e === null ? "null" : Array.isArray(e) ? "array" : typeof e, qg = (e, t) => t === "__proto__" ? Object.hasOwn(e, t) : t in e;
function Jg(e) {
	let t = Wg.get(e);
	if (t) return t;
	let n, r = 0, i, a, o = !0, s = [];
	for (let t = 0; t < e.length; t++) {
		let c = e[t], l = Vg(c);
		if (eg(l)) continue;
		if (tg(l) || ng(l)) {
			a ??= /* @__PURE__ */ new Map();
			let e = tg(l) ? l.literal : l.symbol;
			s[t] = e;
			let n = a.get(e);
			n || a.set(e, n = []), n.push(t);
		} else o = !1;
		let u = Ug(l);
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
			let e = Hg(l);
			for (let n of e) (i[n] ??= []).push(t);
		}
	}
	let c = {}, l = (e) => c[e] ??= Object.freeze(i?.[e] ?? Gg);
	if (o && a) a.forEach(Object.freeze), t = (e) => a.get(e) ?? Gg;
	else if (n?.size === 1 && !i) {
		let [r, [i]] = n.entries().next().value, a = /* @__PURE__ */ new Map();
		for (let [e, t] of i) a.set(e, Object.freeze(Array.from(t)));
		let o = Object.freeze(e.map((e, t) => t));
		t = (e, t) => {
			if (zi(e)) {
				let n = qg(e, r) ? e[r] : void 0;
				if (n !== void 0) return a.get(n) ?? Gg;
				if (t) return o;
			}
			return Gg;
		};
	} else if (n) {
		let e;
		for (let t of n) (!e || t[1][0].size > e[1][0].size) && t[1][1].size === r && (e = t);
		t = (t, r) => {
			let a = Kg(t);
			if (!zi(t)) return l(a);
			let o = new Set(i?.[a]), s;
			if (e) {
				let [n, [i]] = e, c = qg(t, n), u = c ? t[n] : void 0;
				if (c && (!r || u !== void 0)) {
					let e = i.get(u);
					if (!e) return l(a);
					for (let t of e) o.add(t);
					s = n;
				}
			}
			if (s === void 0) for (let [e, [i, a]] of n) {
				let n = qg(t, e), s = n ? t[e] : void 0;
				if (n && (!r || s !== void 0)) {
					let e = i.get(s);
					if (e) for (let t of e) o.add(t);
				} else if (r) for (let e of a) o.add(e);
			}
			for (let [e, [i, a]] of n) {
				if (e === s) continue;
				let n = qg(t, e), c = n ? t[e] : void 0;
				if (n && (!r || c !== void 0)) {
					let e = i.get(c);
					for (let t of o) a.has(t) && !e?.has(t) && o.delete(t);
				}
			}
			return Array.from(o).sort((e, t) => e - t);
		};
	} else t = (e) => {
		let t = l(Kg(e));
		return a ? t.filter((t) => s[t] === void 0 || s[t] === e) : t;
	};
	return Wg.set(e, t), t;
}
var Yg = class extends ug {
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
			if (e === Q) return oh;
			let i = (o ??= Jg(n.types))(e, r);
			if (i.length === 0) return X(new xh(n, [], e, t));
			if (i.length === 1) {
				let r = a(i[0])(e, t);
				return r._tag === "Success" ? r : q(r) ? Xg(n, r.cause, e, t) : Zg(n, r, e, t);
			}
			return Qg(n, a, i, e, t);
		};
	}
	_rebuild(e, t, n) {
		let r = T_(this.types, e);
		return r === this.types && t === this.checks && n === this.encodingChecks ? this : new Yg(r, this.options, this.annotations, t, void 0, this.context, n);
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
			let n = L_(t);
			switch (n._tag) {
				case "Arrays": {
					let t = n.elements.filter(tg);
					if (t.length > 0) return `${n_(n.isMutable)}[ ${t.map((t) => e(t) + r_(t.context?.isOptional)).join(", ")}, ... ]`;
					break;
				}
				case "Objects": {
					let t = n.propertySignatures.filter((e) => tg(e.type));
					if (t.length > 0) return `{ ${t.map((t) => `${n_(t.type.context?.isMutable)}${Aa(t.name)}${r_(t.type.context?.isOptional)}: ${e(t.type)}`).join(", ")}, ... }`;
					break;
				}
			}
			return e(n);
		});
		return Array.from(new Set(n)).join(" | ");
	}
};
function Xg(e, t, n, r) {
	let i = Ih(t);
	return i ? Jf(new xh(e, [i], n, r)) : qf(t);
}
function Zg(e, t, n, r) {
	return sm(t, (t) => Xg(e, t, n, r));
}
function Qg(e, t, n, r, i) {
	let a = {
		ast: e,
		parser: t,
		input: r,
		out: void 0,
		successes: e.options?.mode === "oneOf" ? [] : void 0,
		issues: void 0,
		options: i
	}, o = e_(a, n);
	return o ? $g(o, a) : a.out ? a.out : X(new xh(e, a.issues ?? [], r, i));
}
function $g(e, t) {
	return Mm(e, (e) => t.out === $ ? J(t.input) : t.out ? t.out : X(new xh(t.ast, t.issues ?? [], t.input, t.options)));
}
var e_ = /*#__PURE__*/ tf()({
	onItem(e, t) {
		return e.parser(t)(e.input, e.options);
	},
	step(e, t, n) {
		if (n._tag === "Failure") {
			let t = Ih(n.cause);
			if (t === void 0) return n;
			e.issues ? e.issues.push(t) : e.issues = [t];
		} else {
			if (e.out && e.successes) return e.successes.push(e.ast.types[t]), Jf(new Sh(e.ast, e.successes, e.input, e.options));
			if (e.out = n, e.successes) e.successes.push(e.ast.types[t]);
			else return Yf;
		}
	}
}), t_ = /*#__PURE__*/ new Yg([
	/*#__PURE__*/ new pg("Infinity"),
	/*#__PURE__*/ new pg("-Infinity"),
	/*#__PURE__*/ new pg("NaN")
]);
function n_(e) {
	return e ? "" : "readonly ";
}
function r_(e) {
	return e ? "?" : "";
}
var i_ = class extends yi {
	_tag = "Filter";
	run;
	annotations;
	aborted;
	constructor(e, t = void 0, n = !1) {
		super(), this.run = e, this.annotations = t, this.aborted = n;
	}
	annotate(e) {
		return new i_(this.run, {
			...this.annotations,
			...e
		}, this.aborted);
	}
	abort() {
		return new i_(this.run, this.annotations, !0);
	}
	and(e, t) {
		return new a_([this, e], t);
	}
}, a_ = class extends yi {
	_tag = "FilterGroup";
	checks;
	annotations;
	constructor(e, t = void 0) {
		super(), this.checks = e, this.annotations = t;
	}
	annotate(e) {
		return new a_(this.checks, {
			...this.annotations,
			...e
		});
	}
	and(e, t) {
		return new a_([this, e], t);
	}
};
function o_(e, t, n = !1) {
	return new i_((t, n, r) => Th(n, e(t, n, r), t, r), t, n);
}
function s_(e) {
	return o_((e) => globalThis.Number.isFinite(e), {
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
var c_ = /*#__PURE__*/ y_(vg, [/*#__PURE__*/ s_()]), l_ = /*#__PURE__*/ new og(/*#__PURE__*/ new Yg([c_, t_]), /*#__PURE__*/ new Kh(/*#__PURE__*/ Uh(), /*#__PURE__*/ Vh((e) => globalThis.Number.isFinite(e) ? e : globalThis.String(e))));
function u_(e, t) {
	let n = new globalThis.RegExp(e), r = {
		source: n.source,
		flags: n.flags
	};
	return o_((e) => (n.lastIndex = 0, n.test(e)), {
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
var d_ = /*#__PURE__*/ new WeakMap();
function f_(e, t) {
	let n = Object.assign(Object.create(Object.getPrototypeOf(e)), e, t);
	return Reflect.ownKeys(t).every((e) => e === "context" || e === "encoding") && d_.set(n, p_(e)), n;
}
function p_(e) {
	let t = d_.get(e);
	if (t !== void 0) return t;
	if (e.encoding === void 0) return e;
	let n = Object.assign(Object.create(Object.getPrototypeOf(e)), e, { encoding: void 0 });
	return d_.set(e, n), n;
}
function m_(e, t) {
	return e.encoding === t ? e : f_(e, { encoding: t });
}
function h_(e, t) {
	if (e.context === t) return e;
	let n = p_(e);
	return n.context === t && n.encoding === e.encoding ? n : f_(e, { context: t });
}
function g_(e) {
	return e.encoding ? g_(e.encoding[e.encoding.length - 1].to) : e;
}
function __(e, t) {
	if (e.checks) {
		let n = e.checks[e.checks.length - 1];
		return v_(e, sc(e.checks.slice(0, -1), n.annotate(t)));
	}
	return f_(e, { annotations: {
		...e.annotations,
		...t
	} });
}
function v_(e, t) {
	if (e._tag === "Suspend" && t) throw Error("Cannot add checks to Suspend");
	return e.checks === t ? e : f_(e, { checks: t });
}
function y_(e, t) {
	return v_(e, Lg(e.checks, t));
}
function b_(e, t) {
	let n = t(e.to);
	return n === e.to ? e : new og(n, e.transformation);
}
function x_(e, t) {
	let n = e, r = n[n.length - 1], i = b_(r, t);
	return i === r ? e : sc(e.slice(0, e.length - 1), i);
}
function S_(e) {
	return (t) => t.encoding ? m_(t, x_(t.encoding, e)) : t;
}
function C_(e, t) {
	function n(r) {
		if (r.encoding) {
			let e = r.encoding[r.encoding.length - 1];
			return t?.stopAt?.(e) ? r : m_(r, x_(r.encoding, n));
		}
		return e(r);
	}
	return Ei(n);
}
function w_(e, t, n) {
	let r = new og(e, t);
	return m_(n, n.encoding ? [...n.encoding, r] : [r]);
}
function T_(e, t) {
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
function E_(e, t) {
	return h_(e, e.context ? new cg(e.context.isOptional, e.context.isMutable, e.context.constructorDefault, {
		...e.context.annotations,
		...t
	}) : new cg(!1, !1, void 0, t));
}
var D_ = /*#__PURE__*/ Ei((e) => O_(h_(e, e.context ? e.context.isOptional === !1 ? new cg(!0, e.context.isMutable, e.context.constructorDefault, e.context.annotations) : e.context : new cg(!0, !1)))), O_ = /*#__PURE__*/ S_(D_);
function k_(e, t, n) {
	return w_(e, n, t);
}
function A_(e) {
	let t = [], n = [];
	function r(e) {
		switch (e._tag) {
			case "Literal":
				Fi(e.literal) && !t.includes(e.literal) && t.push(e.literal);
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
function j_(e, t) {
	let { literals: n, parameters: r } = A_(e);
	return new Mg(n.map((e) => new Dg(e, t)), r.map((e) => new jg(e, t)));
}
function M_(e) {
	return e.context?.isOptional ?? !1;
}
function N_(e) {
	return e.annotations?.["~structural"] === !0 || e._tag === "FilterGroup" && e.checks.every(N_);
}
function P_(e) {
	function t(e) {
		return N_(e) ? [e] : e._tag === "FilterGroup" ? e.checks.flatMap(t) : [];
	}
	let n = e.flatMap(t);
	return cc(n) ? n : void 0;
}
function F_(e) {
	let t = !0;
	function n(e) {
		return t = t && !e.encoding && !ag(e), t && "recur" in e && e.recur(n), e;
	}
	return "recur" in e && e.recur(n), t;
}
var I_ = /*#__PURE__*/ Ei((e) => {
	let t = p_(e);
	if (t !== e) {
		let n = I_(t);
		return n === t && e.encoding === void 0 ? e : h_(n, e.context);
	}
	let n = "recur" in e ? e.recur(I_) : e;
	if ("encodingChecks" in n && n.encodingChecks) {
		let t = F_(e) ? n.encodingChecks : rg(n) || ig(n) || $h(n) && n.typeParameters.length > 0 ? P_(n.encodingChecks) : void 0;
		return f_(n, {
			encodingChecks: void 0,
			checks: Lg(n.checks, t)
		});
	}
	return n;
}), L_ = /*#__PURE__*/ Ei((e) => I_(z_(e)));
function R_(e, t) {
	let n = t, r = n.length, i = n[r - 1], a = [new og(z_(m_(e, void 0)), n[0].transformation.flip())];
	for (let e = 1; e < r; e++) a.unshift(new og(z_(n[e - 1].to), n[e].transformation.flip()));
	let o = z_(i.to);
	return o.encoding ? m_(o, [...o.encoding, ...a]) : m_(o, a);
}
var z_ = /*#__PURE__*/ Ti((e) => {
	if (e.encoding) return R_(e, e.encoding);
	let t = p_(e);
	if (t !== e) {
		let n = z_(t);
		return n === t ? e : h_(n, e.context);
	}
	return "flip" in e ? e.flip(z_) : "recur" in e ? e.recur(z_) : e;
});
function B_(e) {
	switch (e._tag) {
		case "Undefined": return !0;
		case "Union": return e.types.some(B_);
		default: return !1;
	}
}
function V_(e, t) {
	let n = t === 0 ? $ : ah(t);
	return (r, i) => r === Q ? oh : r === t ? n : X(new yh(e, r, i));
}
function H_(e, t) {
	return (n, r) => n === Q ? oh : t(n) ? $ : X(new yh(e, n, r));
}
var U_ = /*#__PURE__*/ C_((e) => {
	switch (e._tag) {
		default: return e;
		case "Number": return e.toCodecStringTree();
		case "Union": return e.recur(U_);
	}
}), W_ = /*#__PURE__*/ new globalThis.RegExp(`^${Tg}$`), G_ = /*#__PURE__*/ new globalThis.RegExp(`^(?:${Tg}|Infinity|-Infinity|NaN)$`);
function K_(e) {
	return u_(W_, {
		expected: "a string representing a finite number",
		representation: {
			id: "effect/schema/isStringFinite",
			payload: null
		},
		toJsonSchema: () => ({ pattern: W_.source }),
		...e
	});
}
var q_ = /*#__PURE__*/ y_(hg, [/*#__PURE__*/ K_()]), J_ = /*#__PURE__*/ new og(q_, Zh), Y_ = /*#__PURE__*/ new og(/*#__PURE__*/ new Yg([q_, t_]), Zh);
function X_(e, t, n, r, i) {
	for (let a = 0; a < e.length; a++) {
		let o = e[a];
		if (o._tag === "FilterGroup") {
			if (n = X_(o.checks, t, n, r, i), n && (i.errors !== "all" || n[n.length - 1].filter.aborted)) return n;
		} else {
			let e = o.run(t, r, i);
			if (e) {
				let r = new ph(o, e, t, i);
				if (n ? n.push(r) : n = [r], i.errors !== "all" || o.aborted) return n;
			}
		}
	}
	return n;
}
function Z_(e) {
	if (!$h(e)) return;
	let t = e.annotations?.[rh];
	return Ii(t) ? t(e.typeParameters) : void 0;
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/internal/schema/interpreter.js
var Q_ = (e, t, n) => e === $ ? n(t) : Mm(e, n);
function $_(e) {
	if (e._tag === "Middleware") return (t, n, r) => ev(t === $ ? e.decode(ah(sh(n)), r) : e.decode(jm(t, sh), r));
	let t = e.decode;
	switch (t._tag) {
		case "Passthrough": return (e, t) => e === $ ? ah(t) : e;
		case "Transform": {
			let e = (e) => e === Q ? oh : ah(t.transform(e));
			return (t, n) => Q_(t, n, e);
		}
		case "TransformOptional": {
			let e = (e) => ch(t.transform(sh(e)));
			return (t, n) => Q_(t, n, e);
		}
		case "TransformEffect": return (e, n, r) => Q_(e, n, (e) => e === Q ? oh : t.transform(e, r));
		case "TransformOptionalEffect": return (e, n, r) => Q_(e, n, (e) => ev(t.transform(sh(e), r)));
	}
}
var ev = (e) => Mm(e, ch), tv = (e, t, n, r) => sm(r, (r) => Xp(() => Uf(r, (r) => new mh(e, r, t, n))));
function nv(e, t) {
	let n = $_(e.link.transformation), r;
	return (i, a) => {
		if (i === Q) return oh;
		if (e.isConstructed(i)) return $;
		let o = (r ??= t(e.link.to))(i, a);
		return n(o, i, a);
	};
}
function rv(e, t) {
	let n = e.context.constructorDefault;
	return (r, i) => {
		if (r !== Q && r !== void 0) return t(r, i);
		let a = n;
		if (q(a) && a._tag === "Success") {
			let e = t(a[L], i);
			return e === $ ? a : e;
		}
		return Mm(tv(e, r, i, a), (e) => {
			let n = t(e, i);
			return n === $ ? ah(e) : n;
		});
	};
}
function iv(e, t) {
	let n = t(e);
	return e.context?.constructorDefault === void 0 ? n : rv(e, n);
}
function av(e, t, n, r, i) {
	if (e._tag === "Declaration") for (let n of e.typeParameters) t(n);
	let a = n ? Z_(e) : void 0, o = a ? nv(a, t) : r ?? e.getParser(t, n), s = e.checks, c = e.encoding, l = c?.map((e) => $_(e.transformation)), u = e.encodingChecks;
	if (!c && !s && !u) return o;
	let d, f = (t, n) => {
		let r = o(t, n);
		if (u && !n.disableChecks) {
			if (q(r)) {
				if (r._tag === "Success") {
					let i = r === $ ? t : r[L];
					if (t !== Q && i !== Q) {
						let i = X_(u, t, void 0, e, n);
						i && (r = X(new vh(e, i, t, n)));
					}
				}
			} else r = Z(r, (r) => {
				if (t !== Q && r !== Q) {
					let r = X_(u, t, void 0, e, n);
					if (r) return X(new vh(e, r, t, n));
				}
				return J(r);
			});
		}
		if (s && !n.disableChecks) {
			if (q(r)) {
				if (r._tag === "Success") {
					let i = r === $ ? t : r[L];
					if (i === Q) return r;
					let a = X_(s, i, void 0, e, n);
					a && (r = X(new vh(e, a, i, n)));
				}
			} else r = Z(r, (t) => {
				if (t !== Q) {
					let r = X_(s, t, void 0, e, n);
					if (r) return X(new vh(e, r, t, n));
				}
				return J(t);
			});
		}
		return r;
	}, p = i === void 0 ? f : i(f);
	return c ? (n, r) => {
		let i = d ??= c.map((e) => t(e.to)), a = n, o = i[i.length - 1](n, r);
		for (let e = c.length - 1; e >= 0; e--) if (o = l[e](o, a, r), e !== 0) {
			let t = i[e - 1];
			o._tag === "Success" ? (a = o[L], o = t(a, r)) : o = Mm(o, (e) => {
				let n = t(e, r);
				return n === $ ? ah(e) : n;
			});
		}
		if (o._tag === "Success") {
			let e = o[L], t = p(e, r);
			return t === $ ? o : t;
		}
		return o = tv(e, n, r, o), Mm(o, (e) => {
			let t = p(e, r);
			return t === $ ? ah(e) : t;
		});
	} : p;
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/internal/schema/compilerRegistry.js
var ov = /*#__PURE__*/ Symbol(), sv = /*#__PURE__*/ new WeakMap(), cv = (e) => fv(e).parser, lv = (e) => fv(e).makeEffect, uv = (e) => iv(e, lv), dv = class {
	ast;
	constructor(e) {
		this.ast = e;
	}
	get decodeEffect() {
		return this.cachedDecodeEffect ??= av(this.ast, cv);
	}
	get parser() {
		return this.decodeEffect;
	}
	get makeEffect() {
		return this.cachedMakeEffect ??= av(this.ast, lv, uv);
	}
};
function fv(e) {
	let t = sv.get(e);
	if (t !== void 0) return t;
	let n = new dv(e);
	return sv.set(e, n), n;
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/SchemaParser.js
function pv(e) {
	let t = e.ast, n;
	return (e, r) => (n ??= xv(Tv, I_(t)))(e, r?.disableChecks ? r?.parseOptions ? {
		...r.parseOptions,
		disableChecks: !0
	} : { disableChecks: !0 } : r?.parseOptions);
}
function mv(e) {
	let t = pv(e);
	return (e, n) => {
		let r = Om(t(e, n));
		return Xf(r) ? ps(r.value) : (Lh(r.cause, "Option adapter can only return none for schema issues"), fs());
	};
}
function hv(e) {
	return Cv(I_(e.ast));
}
function gv(e, t) {
	let n = yv(e.ast);
	return t === void 0 ? n : (e, r) => n(e, _v(t, r));
}
var _v = (e, t) => t ? {
	...e,
	...t
} : e, vv = (e) => e === Q ? X(new bh()) : J(e);
function yv(e) {
	return xv(wv, e);
}
function bv(e, t) {
	return e === $ ? J(t) : q(e) ? e[L] === Q ? vv(Q) : e : Mm(e, vv);
}
function xv(e, t) {
	let n;
	return (r, i) => {
		let a = (n ??= e(t))(r, i ?? sg);
		return a === $ ? J(r) : q(a) ? a[L] === Q ? vv(Q) : a : Mm(a, vv);
	};
}
function Sv(e, t) {
	let n = Om(e);
	if (Xf(n)) return n.value;
	let r = Lh(n.cause, t);
	throw Error("Schema validation failed", { cause: r });
}
function Cv(e) {
	let t, n;
	return (r, i) => {
		t ??= fv(e);
		let a = i?.disableChecks ? i.parseOptions ? {
			...i.parseOptions,
			disableChecks: !0
		} : { disableChecks: !0 } : i?.parseOptions ?? sg, o = t.make;
		if (o !== void 0 && r !== Q) {
			let e;
			try {
				e = o(r, a);
			} catch (e) {
				throw Lh(Hf(e), "Constructor adapter can only throw schema issues"), e;
			}
			if (e !== ov && e !== Q) return e;
		}
		return Sv(bv((n ??= t.makeEffect)(r, a), r), "Constructor adapter can only throw schema issues");
	};
}
var wv = (e) => fv(e).parser, Tv = (e) => fv(e).makeEffect, Ev = "~effect/Schema/Schema", Dv = /*#__PURE__*/ Symbol(), Ov = {
	[Ev]: Ev,
	get make() {
		let e = hv(this);
		return Object.defineProperty(this, "make", {
			value: e,
			enumerable: !0
		}), e;
	},
	get makeEffect() {
		let e = pv(this);
		return Object.defineProperty(this, "makeEffect", {
			value: e,
			enumerable: !0
		}), e;
	},
	get makeOption() {
		let e = mv(this);
		return Object.defineProperty(this, "makeOption", {
			value: e,
			enumerable: !0
		}), e;
	},
	pipe() {
		return _i(this, arguments);
	},
	annotate(e) {
		return this.rebuild(__(this.ast, e));
	},
	annotateKey(e) {
		return this.rebuild(E_(this.ast, e));
	},
	check(...e) {
		return this.rebuild(y_(this.ast, e));
	},
	rebuild(e) {
		return kv(e, this[Dv]);
	}
};
function kv(e, t) {
	function n() {}
	let r = Object.setPrototypeOf(n, Ov);
	return t && (Object.hasOwn(t, "name") || Object.hasOwn(t, "length") || Object.hasOwn(t, "__proto__")) ? Object.defineProperties(r, Object.getOwnPropertyDescriptors({ ...t })) : Object.assign(r, t), r[Dv] = t, r.ast = e, r;
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/Struct.js
var Av = (e) => e, jv = "~effect/Schema/SchemaError", Mv = class extends (/*#__PURE__*/ rl("SchemaError")) {
	[jv] = jv;
	constructor(e) {
		let t = za();
		Ba(0);
		try {
			super({ issue: e });
		} finally {
			Ba(t);
		}
	}
	get message() {
		return Nh(this.issue);
	}
	toString() {
		return `SchemaError(${this.message})`;
	}
};
function Nv(e) {
	return q(e) ? Pv(e) : sm(e, (e) => Xp(() => Uf(e, (e) => new Mv(e))));
}
function Pv(e) {
	return Xf(e) ? e : qf(Uf(e.cause, (e) => new Mv(e)));
}
function Fv(e, t) {
	let n = gv(e, t);
	return (e, t) => Nv(n(e, t));
}
var Iv = kv, Lv = /*#__PURE__*/ Av((e) => Iv(D_(e.ast), { schema: e }));
function Rv(e) {
	let t = Iv(new pg(e), {
		literal: e,
		transform(n) {
			return t.pipe(qv(Rv(n), {
				decode: Vh(() => n),
				encode: Vh(() => e)
			}));
		}
	});
	return t;
}
var zv = /*#__PURE__*/ Iv(hg);
function Bv(e, t) {
	return Iv(e, {
		fields: t,
		mapFields(e, t) {
			let n = e(this.fields);
			return Bv(Rg(n, t?.unsafePreserveChecks ? this.ast.checks : void 0), n);
		}
	});
}
function Vv(e) {
	return Bv(Rg(e, void 0), e);
}
function Hv(e, t) {
	return Iv(j_(e.ast, t.ast), {
		key: e,
		value: t
	});
}
var Uv = /*#__PURE__*/ Av((e) => Iv(new yg(!1, [], [e.ast]), { value: e }));
function Wv(e, t) {
	return Iv(e, {
		members: t,
		mapMembers(e, t) {
			let n = e(this.members);
			return Wv(Bg(n, this.ast.options, t?.unsafePreserveChecks ? this.ast.checks : void 0), n);
		}
	});
}
function Gv(e, t) {
	return Wv(Bg(e, t, void 0), e);
}
function Kv(e) {
	let t = e.map(Rv);
	return Iv(Bg(t, void 0, void 0), {
		literals: e,
		members: t,
		mapMembers(e) {
			return Gv(e(this.members));
		},
		pick(e) {
			return Kv(e);
		},
		transform(e) {
			return Gv(t.map((t, n) => t.transform(e[n])));
		}
	});
}
function qv(e, t) {
	return (n) => Iv(k_(n.ast, e.ast, t ? Jh(t) : Xh()), {
		from: n,
		to: e
	});
}
var Jv = /*#__PURE__*/ Iv(c_);
globalThis.RegExp, globalThis.URL, globalThis.File, globalThis.FormData, globalThis.URLSearchParams, globalThis.Uint8Array;
var Yv = Jl, Xv = uf, Zv = vf, Qv = "~effect/MutableRef", $v = {
	[Qv]: Qv,
	...$a,
	toJSON() {
		return {
			_id: "MutableRef",
			current: Ia(this.current)
		};
	}
}, ey = (e) => {
	let t = Object.create($v);
	return t.current = e, t;
}, ty = /*#__PURE__*/ N(2, (e, t) => (e.current = t, e)), ny = /*#__PURE__*/ Symbol.for("effect/MutableList/Empty"), ry = () => ({
	head: void 0,
	tail: void 0,
	length: 0
}), iy = (e) => {
	let t = e.head;
	t.offset >= 1024 && t === e.tail && t.mutable && (t.array.length - t.offset) * 8 <= t.offset && (e.head = e.tail = {
		array: t.array.slice(t.offset),
		mutable: !0,
		offset: 0,
		next: void 0
	});
}, ay = () => ({
	array: [],
	mutable: !0,
	offset: 0,
	next: void 0
}), oy = (e, t) => {
	e.tail ? e.tail.mutable || (e.tail.next = ay(), e.tail = e.tail.next) : e.head = e.tail = ay(), e.tail.array.push(t), e.length++;
}, sy = (e, t) => {
	e.head = {
		array: [t],
		mutable: !0,
		offset: 0,
		next: e.head
	}, e.tail ||= e.head, e.length++;
}, cy = (e) => {
	e.head = e.tail = void 0, e.length = 0;
}, ly = (e, t) => {
	if (t = Qs(t), t <= 0 || !e.head) return [];
	if (t = Math.min(t, e.length), t === e.length && e.head?.offset === 0 && !e.head.next) {
		let t = e.head.array;
		return cy(e), t;
	}
	let n = Array(t), r = 0, i = e.head;
	for (; i;) {
		for (; i.offset < i.array.length;) if (n[r++] = i.array[i.offset], i.mutable && (i.array[i.offset] = void 0), i.offset++, r === t) return e.head = i.offset === i.array.length && i.next ? i.next : i, e.length -= t, e.length === 0 ? cy(e) : iy(e), n;
		i = i.next;
	}
	return cy(e), n;
}, uy = (e) => ly(e, e.length), dy = (e) => {
	if (!e.head) return ny;
	let t = e.head.array[e.head.offset];
	return e.head.mutable && (e.head.array[e.head.offset] = void 0), e.head.offset++, e.length--, e.head.offset === e.head.array.length ? e.head.next ? e.head = e.head.next : cy(e) : iy(e), t;
}, fy = (e, t) => {
	let n = [], r = e.head, i = 0;
	for (; r;) {
		for (let e = r.offset; e < r.array.length; e++) t(r.array[e], i++) && n.push(r.array[e]);
		r = r.next;
	}
	if (n.length === 0) {
		cy(e);
		return;
	}
	e.head = e.tail = {
		array: n,
		mutable: !0,
		offset: 0,
		next: void 0
	}, e.length = n.length;
}, py = (e, t) => fy(e, (e) => e !== t), my = "~effect/PubSub", hy = "~effect/PubSub/Subscription", gy = (e) => Y(() => My(e.atomicPubSub(), /* @__PURE__ */ new Map(), op(), Zv(!1), ey(!1), e.strategy(), ey(fs()))), _y = (e) => gy({
	atomicPubSub: () => vy(e),
	strategy: () => new Ny()
}), vy = (e) => {
	let t = e?.replay;
	return new Oy(t && t > 0 ? new Iy(Math.ceil(t)) : void 0);
}, yy = /*#__PURE__*/ N(2, (e, t) => e.shutdownFlag.current || hs(e.ended.current) ? !1 : e.pubsub.publish(t) ? (e.strategy.completeSubscribersUnsafe(e.pubsub, e.subscribers), !0) : !1), by = (e) => xm(mm((t) => {
	let n = Ws(t, ap), r = up(e.scope), i = Dy(e.pubsub, e.subscribers, e.strategy, e.ended);
	return lp(r, xy(i)).pipe(em(cp(n, (e) => dp(r, e))), im(i));
})), xy = (e) => xm(Qp((t) => (ty(e.shutdownFlag, !0), Up(uy(e.pollers), (e) => rp(e, t.id), {
	discard: !0,
	concurrency: "unbounded"
}).pipe(tm(() => Y(() => {
	e.subscribers.delete(e.subscription), e.subscription.unsubscribe(), e.replayWindow.close(), e.strategy.onPubSubEmptySpaceUnsafe(e.pubsub, e.subscribers);
})), dm(e.shutdownHook.open), am)))), Sy = (e) => Gp(function t(n) {
	if (e.shutdownFlag.current) return ym;
	let r = e.pollers.length === 0 ? e.subscription.pollUpTo(Infinity) : [];
	return n && (r = n.concat(r)), e.strategy.onPubSubEmptySpaceUnsafe(e.pubsub, e.subscribers), e.replayWindow.remaining > 0 ? J(e.replayWindow.takeAll().concat(r)) : cc(r) ? J(r) : Z(Cy(e), (e) => t([e]));
}), Cy = (e) => qp((t) => {
	if (e.shutdownFlag.current) return t(ym);
	if (hs(e.ended.current)) return t(J(e.ended.current.value));
	let n = $f(), r = e.subscribers.get(e.subscription);
	return r || (r = /* @__PURE__ */ new Set(), e.subscribers.set(e.subscription, r)), r.add(e.pollers), oy(e.pollers, n), e.strategy.completePollersUnsafe(e.pubsub, e.subscribers, e.subscription, e.pollers), n.effect ? t(n.effect) : (n.resumes = [t], Y(() => py(e.pollers, n)));
}), wy = /*#__PURE__*/ Symbol.for("effect/PubSub/AbsentValue"), Ty = (e, t, n) => {
	e.has(t) || e.set(t, /* @__PURE__ */ new Set()), e.get(t).add(n);
}, Ey = (e, t, n) => {
	if (!e.has(t)) return;
	let r = e.get(t);
	r.delete(n), r.size === 0 && e.delete(t);
}, Dy = (e, t, n, r) => new Ay(e, t, e.subscribe(), ry(), Zv(!1), ey(!1), n, e.replayWindow(), r), Oy = class {
	publisherHead = {
		value: wy,
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
		return this.replayBuffer ? new Ly(this.replayBuffer) : Ry;
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
			this.publisherHead = this.publisherHead.next, this.publisherHead.value = wy, this.subscribersIndex += 1, this.replayBuffer?.slide(t, e.replayIndex);
		}
	}
	subscribe() {
		return this.publisherTail.subscribers += 1, new ky(this, this.publisherTail, this.publisherIndex, !1);
	}
}, ky = class {
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
		for (; t;) this.subscriberHead === this.self.publisherTail ? t = !1 : this.subscriberHead.next.value === wy ? (this.subscriberHead = this.subscriberHead.next, this.subscriberIndex += 1) : (e = !1, t = !1);
		return e;
	}
	size() {
		return this.unsubscribed ? 0 : this.self.publisherIndex - Math.max(this.subscriberIndex, this.self.subscribersIndex);
	}
	poll() {
		if (this.unsubscribed) return ny;
		let e = !0, t = ny;
		for (; e;) if (this.subscriberHead === this.self.publisherTail) e = !1;
		else {
			let n = this.subscriberHead.next.value;
			n !== wy && (t = n, --this.subscriberHead.subscribers, this.subscriberHead.subscribers === 0 && (this.self.publisherHead = this.self.publisherHead.next, this.self.publisherHead.value = wy, this.self.subscribersIndex += 1), e = !1), this.subscriberHead = this.subscriberHead.next, this.subscriberIndex += 1;
		}
		return t;
	}
	pollUpTo(e) {
		e = Qs(e);
		let t = [], n = 0;
		for (; n !== e;) {
			let r = this.poll();
			r === ny ? n = e : (t.push(r), n += 1);
		}
		return t;
	}
	unsubscribe() {
		if (!this.unsubscribed) for (this.unsubscribed = !0, --this.self.publisherTail.subscribers; this.subscriberHead !== this.self.publisherTail;) this.subscriberHead.next.value !== wy && (--this.subscriberHead.subscribers, this.subscriberHead.subscribers === 0 && (this.self.publisherHead = this.self.publisherHead.next, this.self.publisherHead.value = wy, this.self.subscribersIndex += 1)), this.subscriberHead = this.subscriberHead.next;
	}
}, Ay = class {
	[hy] = { _A: P };
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
		return _i(this, arguments);
	}
}, jy = class {
	[my] = { _A: P };
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
		return _i(this, arguments);
	}
}, My = (e, t, n, r, i, a, o) => new jy(e, t, n, r, i, a, o), Ny = class {
	get shutdown() {
		return Kp;
	}
	handleSurplus(e, t, n, r) {
		return J(!1);
	}
	onPubSubEmptySpaceUnsafe(e, t) {}
	completePollersUnsafe(e, t, n, r) {
		return Py(this, e, t, n, r);
	}
	completeSubscribersUnsafe(e, t) {
		return Fy(this, e, t);
	}
}, Py = (e, t, n, r, i) => {
	let a = !0;
	for (; a && !r.isEmpty();) {
		let o = dy(i);
		if (o === ny) Ey(n, r, i), i.length === 0 ? a = !1 : Ty(n, r, i);
		else {
			let a = r.poll();
			a === ny ? sy(i, o) : (ip(o, Kf(a)), e.onPubSubEmptySpaceUnsafe(t, n));
		}
	}
}, Fy = (e, t, n) => {
	for (let [r, i] of n) for (let a of i) e.completePollersUnsafe(t, n, r, a);
}, Iy = class {
	capacity;
	head = {
		value: wy,
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
			value: wy,
			index: 0,
			next: null
		}, this.tail = this.tail.next, this.size === this.capacity ? this.head = this.head.next : this.size += 1, t;
	}
	offerAll(e) {
		for (let t of e) this.offer(t);
	}
}, Ly = class {
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
		return this.values[this.index] = wy, this.index = (this.index + 1) % this.values.length, this.remaining--, this.remaining === 0 && this.close(), e;
	}
	takeN(e) {
		e = Qs(e);
		let t = Math.min(e, this.remaining), n = Array(t);
		for (let e = 0; e < t; e++) n[e] = this.take();
		return n;
	}
	takeAll() {
		return this.takeN(this.remaining);
	}
}, Ry = {
	remaining: 0,
	take: () => void 0,
	takeN: () => [],
	takeAll: () => [],
	close: () => void 0
}, zy = "~effect/Queue", By = "~effect/Queue/Enqueue", Vy = "~effect/Queue/Dequeue", Hy = {
	_A: P,
	_E: P
}, Uy = {
	[zy]: Hy,
	[By]: Hy,
	[Vy]: Hy,
	...$a,
	toJSON() {
		return {
			_id: "effect/Queue",
			state: this.state._tag,
			size: nb(this)
		};
	}
}, Wy = (e) => B((t) => {
	let n = Object.create(Uy);
	return n.dispatcher = t.currentDispatcher, n.capacity = e?.capacity ?? Infinity, n.strategy = e?.strategy ?? "suspend", n.messages = ry(), n.scheduleRunning = !1, n.state = {
		_tag: "Open",
		takers: /* @__PURE__ */ new Set(),
		offers: /* @__PURE__ */ new Set(),
		awaiters: /* @__PURE__ */ new Set()
	}, H(n);
}), Gy = (e) => Wy({ capacity: e }), Ky = /*#__PURE__*/ N(2, (e, t) => W(() => qy(e, t) ? ib : e.state._tag === "Open" && e.strategy === "suspend" ? fb(e, t) : rb)), qy = (e, t) => e.state._tag === "Open" ? e.messages.length >= e.capacity ? e.strategy === "sliding" ? (dy(e.messages), oy(e.messages, t), !0) : e.capacity <= 0 && e.state.takers.size > 0 && (oy(e.messages, t), sb(e), !0) : (oy(e.messages, t), cb(e), !0) : !1, Jy = /*#__PURE__*/ N(2, (e, t) => U(() => Yy(e, t))), Yy = (e, t) => {
	if (e.state._tag !== "Open") return !1;
	let n = Gu(Eo(t), ab);
	return e.state.offers.size === 0 && e.messages.length === 0 ? (_b(e, n), !0) : (e.state = {
		...e.state,
		_tag: "Closing",
		exit: n
	}, cb(e), !0);
}, Xy = (e) => U(() => Zy(e)), Zy = (e) => {
	if (e.state._tag === "Done") return !1;
	cy(e.messages);
	let t = e.state.offers;
	_b(e, e.state._tag === "Open" ? ob : e.state.exit);
	for (let e of t) mb(e);
	return !0;
}, Qy = (e) => $y(e, 1, Infinity), $y = /*#__PURE__*/ N(3, (e, t, n) => (t = Qs(t), n = Qs(n), W(() => lb(e, t, n) ?? ju(db(e, () => ub(e, t)), $y(e, t, n))))), eb = (e) => W(() => tb(e) ?? ju(db(e, () => ub(e, 1)), eb(e))), tb = (e) => {
	if (e.state._tag === "Done") return e.state.exit;
	if (e.messages.length > 0) {
		let t = dy(e.messages);
		return gb(e), z(t);
	}
	if (e.capacity <= 0 && e.state.offers.size > 0) {
		let t = hb(e.state.offers);
		return gb(e), z(t);
	}
}, nb = (e) => e.state._tag === "Done" ? 0 : e.messages.length, rb = /*#__PURE__*/ z(!1), ib = /*#__PURE__*/ z(!0), ab = /*#__PURE__*/ Do(/*#__PURE__*/ Fo()), ob = /*#__PURE__*/ Bu(), sb = (e) => {
	if (e.state._tag !== "Done" && e.state.takers.size !== 0) {
		for (let t of e.state.takers) if (t.ready() && (e.state.takers.delete(t), t.resume(Uu), e.messages.length === 0)) break;
	}
}, cb = (e) => {
	e.scheduleRunning || e.state._tag === "Done" || e.state.takers.size === 0 || (e.scheduleRunning = !0, e.dispatcher.scheduleTask(() => {
		e.scheduleRunning = !1, sb(e);
	}, 0));
}, lb = (e, t, n) => {
	if (e.state._tag === "Done") return e.state.exit;
	if (n <= 0 || t <= 0) return z([]);
	if (!ub(e, t)) return;
	let r = e.messages.length > 0 ? ly(e.messages, n) : [hb(e.state.offers)];
	return gb(e), z(r);
}, ub = (e, t) => e.messages.length >= (e.state._tag === "Closing" ? 1 : Math.min(t, e.capacity || 1)) || e.capacity <= 0 && e.state._tag !== "Done" && e.state.offers.size > 0, db = (e, t) => cu((n) => {
	if (e.state._tag === "Done") return n(e.state.exit);
	if (t()) return n(Uu);
	let r = {
		ready: t,
		resume: n
	};
	return e.state.takers.add(r), U(() => {
		e.state._tag !== "Done" && e.state.takers.delete(r);
	});
}), fb = (e, t) => cu((n) => qy(e, t) ? n(ib) : pb(e, {
	_tag: "Single",
	message: t,
	resume: n
})), pb = (e, t) => {
	if (e.state._tag !== "Open") return mb(t);
	let n = e.state.offers;
	return n.add(t), U(() => {
		e.state._tag !== "Done" && (n.delete(t), e.state._tag === "Closing" && n.size === 0 && e.messages.length === 0 && _b(e, e.state.exit));
	});
}, mb = (e) => e._tag === "Single" ? e.resume(rb) : e.resume(z(e.remaining.slice(e.offset))), hb = (e) => {
	let t = e.values().next().value;
	if (t._tag === "Single") return e.delete(t), t.resume(ib), t.message;
	let n = t.remaining[t.offset++];
	return t.offset === t.remaining.length && (e.delete(t), t.resume(z([]))), n;
}, gb = (e) => {
	if (e.state._tag === "Done") return Ip(e.state.exit.cause);
	if (e.state.offers.size === 0) return e.state._tag === "Closing" && e.messages.length === 0 && (_b(e, e.state.exit), Ip(e.state.exit.cause));
	for (let t of e.state.offers) {
		let n = e.capacity - e.messages.length;
		if (n <= 0) break;
		if (t._tag === "Single") oy(e.messages, t.message), e.state.offers.delete(t), t.resume(ib);
		else {
			for (; t.offset < t.remaining.length; t.offset++) {
				if (n === 0) return !1;
				oy(e.messages, t.remaining[t.offset]), n--;
			}
			e.state.offers.delete(t), t.resume(z([]));
		}
	}
	return !1;
}, _b = (e, t) => {
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
}, vb = (e) => new bb(e), yb = (e, t, n) => cu((r) => {
	if (e.free >= t) return r(n);
	let i = () => {
		e.free < t || (e.waiters.delete(i), r(n));
	};
	return e.waiters.add(i), U(() => {
		e.waiters.delete(i);
	});
}), bb = class {
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
		let t = W(() => this.free < e ? yb(this, e, t) : (this.taken += e, H(e)));
		return t;
	}
	takeIfAvailable(e) {
		return W(() => this.free < e ? H(!1) : (this.taken += e, H(!0)));
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
		return B((t) => (this.permits = e, this.free < 0 || this.releaseUnsafe(t, 0), G));
	}
	release(e) {
		return B((t) => H(this.releaseUnsafe(t, e)));
	}
	get releaseAll() {
		return B((e) => H(this.releaseUnsafe(e, this.taken)));
	}
	withPermits(e) {
		return (t) => Xd((n) => {
			let r = W(() => this.free < e ? K(n(yb(this, e, G)), () => r) : (this.taken += e, Fd(n(t), () => {
				this.releaseUnsafe(zl(), e);
			}, !0)));
			return r;
		});
	}
	withPermit = /*#__PURE__*/ this.withPermits(1);
	withPermitsIfAvailable(e) {
		return (t) => Xd((n) => this.free < e ? tu : (this.taken += e, Fd(n(Au(t)), () => {
			this.releaseUnsafe(zl(), e);
		}, !0)));
	}
}, xb = "~effect/Channel", Sb = (e) => F(e, xb), Cb = {
	[xb]: {
		_Env: P,
		_InErr: P,
		_InElem: P,
		_OutErr: P,
		_OutElem: P
	},
	pipe() {
		return _i(this, arguments);
	}
}, wb = (e) => {
	let t = Object.create(Cb);
	return t.transform = (t, n) => sm(e(t, n), (e) => J(Yp(e))), t;
}, Tb = (e, t) => wb((n, r) => Z(Ob(e)(n, r), (e) => t(e, r))), Eb = (e) => wb((t, n) => e), Db = (e) => wb(km(function* (t, n) {
	let r = up(n), i = (e) => dp(r, Bp(e));
	return _m(yield* _m(e(t, n, r), i), i);
})), Ob = (e) => e.transform, kb = (e, t, n) => Wy({
	capacity: n?.bufferSize,
	strategy: n?.strategy
}).pipe(tm((t) => lp(e, Xy(t))), tm((n) => Cm(sp(t(n), e), e))), Ab = (e, t) => wb((n, r) => rm(kb(r, e, t), Qy)), jb = (e) => Eb(J(bm(Sy(e), () => Gf()))), Mb = (e) => zb(rm(by(e), jb)), Nb = /*#__PURE__*/ N(2, (e, t) => Tb(e, (e) => Y(() => {
	let n = 0;
	return rm(e, (e) => t(e, n++));
}))), Pb = (e) => e === void 0 || e !== "unbounded" && e <= 1, Fb = /*#__PURE__*/ N((e) => Sb(e[0]), (e, t, n) => Pb(n?.concurrency) ? Ib(e, t) : Lb(e, t, n)), Ib = (e, t) => wb((n, r) => {
	let i = 0;
	return rm(Ob(e)(n, r), Z((e) => t(e, i++)));
}), Lb = (e, t, n) => Db(km(function* (r, i, a) {
	let o = 0, s = yield* Ob(e)(r, i), c = n.concurrency === "unbounded" ? 2 ** 53 - 1 : n.concurrency, l = yield* Gy(0);
	yield* lp(a, Xy(l));
	let u = Em(yield* pm()), d = Xv(a);
	if (n.unordered) {
		let e = vb(c), n = bi(e.release(1)), r = fm({
			onFailure: (e) => Z(Jy(l, e), n),
			onSuccess: (e) => Z(Ky(l, e), n)
		});
		yield* e.take(1).pipe(Z(() => s), Z((e) => {
			let n = o++;
			return d(u(r(Gp(() => t(e, n))))), Kp;
		}), Sm({ disableYield: !0 }), sm((t) => e.withPermits(c - 1)(Jy(l, t))), Cm(a));
	} else {
		let e = yield* Gy(c - 2);
		yield* lp(a, Xy(e)), yield* eb(e).pipe($p, Z((e) => Ky(l, e)), Sm({ disableYield: !0 }), sm((e) => Jy(l, e)), Cm(a));
		let n, r = (e) => {
			e._tag !== "Success" && (n = e.cause, Yy(l, e.cause));
		};
		yield* s.pipe(Z((i) => {
			if (n) return Yp(n);
			let a = o++, s = u(Gp(() => t(i, a)));
			return d(s), s.addObserver(r), Ky(e, Yv(s));
		}), Sm({ disableYield: !0 }), sm((t) => Ky(e, qf(t)).pipe(em(Jy(e, t)))), Cm(a));
	}
	return eb(l);
})), Rb = (e) => Tb(e, (e) => {
	let t, n = 0;
	return J(Gp(function r() {
		if (t === void 0) return Z(e, (e) => {
			switch (e.length) {
				case 0: return r();
				case 1: return J(e[0]);
				default: return t = e, J(e[n++]);
			}
		});
		let i = t[n++];
		return n >= t.length && (t = void 0, n = 0), J(i);
	}));
}), zb = (e) => wb((t, n) => {
	let r;
	return J(Gp(() => r || e.pipe(sp(n), Z((e) => Ob(e)(t, n)), Z((e) => r = e))));
}), Bb = (e, t, n) => Gp(() => {
	let r = op();
	return Fp(Z(Ob(e)(Gf(), r), t), n || J).pipe(vm((e) => dp(r, e)));
}), Vb = /*#__PURE__*/ N(2, (e, t) => Bb(e, (e) => Sm(Z(e, t), { disableYield: !0 }))), Hb = (e, t) => Ob(e)(Gf(), t), Ub = "~effect/Stream", Wb = {
	_R: P,
	_E: P,
	_A: P
}, Gb = function(e) {
	this.channel = e;
};
Gb.prototype = {
	[Ub]: Wb,
	pipe() {
		return _i(this, arguments);
	}
};
var Kb = (e) => new Gb(e), qb = "~effect/Stream", Jb = (e) => F(e, qb), Yb = Kb, Xb = (e, t) => Yb(wb((n, r) => Z(Hb(e.channel, r), (e) => t(e, r)))), Zb = (e, t) => Yb(Ab(e, t)), Qb = (e) => Yb(Mb(e)), $b = /*#__PURE__*/ N((e) => Jb(e[0]), (e, t, n) => e.channel.pipe(Rb, Fb(t, n), Nb(fc), Yb)), ex = /*#__PURE__*/ N((e) => Jb(e[0]), (e, t, n) => $b(e, (e) => im(t(e), e), n)), tx = /*#__PURE__*/ N(2, (e, t) => Xb(e, km(function* (e, n) {
	let r = yield* kp, i = Hc(wc(t)), a, o, s = Infinity, c = Zv(), l = Zv(), u = Zv();
	yield* e.pipe(c.whenOpen, Z((e) => (l.openUnsafe(), a = e, s = r.currentTimeMillisUnsafe() + i, Kp)), Sm({ disableYield: !0 }), _m((e) => (o = e, s = r.currentTimeMillisUnsafe(), l.openUnsafe(), u.openUnsafe(), Kp)), Cm(n));
	let d = Gp(function e() {
		let t = r.currentTimeMillisUnsafe();
		return Z(um(lm(s < t ? i : Math.min(i, s - t)), u.await), () => {
			if (r.currentTimeMillisUnsafe() < s) return e();
			if (a) {
				l.closeUnsafe(), c.closeUnsafe();
				let e = J(fc(uc(a)));
				return a = void 0, e;
			}
			return o ? Yp(o) : e();
		});
	});
	return Gp(() => {
		if (o) {
			if (a) {
				let e = J(fc(uc(a)));
				return a = void 0, e;
			}
			return Yp(o);
		}
		return c.openUnsafe(), l.whenOpen(d);
	});
}))), nx = /*#__PURE__*/ N(2, (e, t) => Vb(e.channel, (e) => {
	let n = 0;
	return Wp({
		while: () => n < e.length,
		body: () => t(e[n++]),
		step: wi
	});
})), rx = Lf, ix = (e) => B((t) => e(t.getRef(rx))), ax = (...e) => ix((t) => U(() => {
	t.error(...e);
})), ox = {
	"~effect/Ref": { _A: P },
	...$a,
	toJSON() {
		return {
			_id: "Ref",
			ref: this.ref
		};
	}
}, sx = (e) => {
	let t = Object.create(ox);
	return t.ref = ey(e), t;
}, cx = (e) => Y(() => sx(e)), lx = (e) => Y(() => e.ref.current), ux = /*#__PURE__*/ N(2, (e, t) => Y(() => ty(e.ref, t))), dx = "~effect/SubscriptionRef", fx = {
	...$a,
	[dx]: { _A: P },
	toJSON() {
		return {
			_id: "SubscriptionRef",
			value: this.value
		};
	}
}, px = (e) => rm(_y({ replay: 1 }), (t) => {
	let n = Object.create(fx);
	return n.semaphore = vb(1), n.value = e, n.pubsub = t, yy(n.pubsub, e), n;
}), mx = (e) => Qb(e.pubsub), hx = (e, t) => {
	e.value = t, yy(e.pubsub, t);
}, gx = /*#__PURE__*/ N(2, (e, t) => e.semaphore.withPermit(Y(() => hx(e, t)))), _x = {
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
}, vx = /^@(media|supports|container|scope|starting-style)\b/i, yx = (e, t) => {
	let n = 0;
	for (let r = t; r < e.length; r++) {
		let t = e[r];
		if (t === "\"" || t === "'") r = bx(e, r);
		else if (t === "{" || t === "(" || t === "[") n++;
		else if ((t === "}" || t === ")" || t === "]") && --n === 0) return r + 1;
	}
	return e.length;
}, bx = (e, t) => {
	for (let n = t + 1; n < e.length; n++) if (e[n] === "\\") n++;
	else if (e[n] === e[t]) return n;
	return e.length;
}, xx = (e, t) => {
	let n = [], r = 0, i = 0;
	for (let a = 0; a < e.length; a++) {
		let o = e[a];
		o === "\"" || o === "'" ? a = bx(e, a) : o === "(" || o === "[" || o === "{" ? r++ : o === ")" || o === "]" || o === "}" ? r-- : o === t && r === 0 && (n.push(e.slice(i, a)), i = a + 1);
	}
	return n.push(e.slice(i)), n.flatMap((e) => e.trim() ? [e.trim()] : []);
}, Sx = (e) => xx(e, ";").flatMap((e) => {
	let t = e.indexOf(":");
	if (t <= 0) return [];
	let n = e.slice(0, t).trim(), r = e.slice(t + 1).trim(), i = /!\s*important$/i.test(r);
	return i && (r = r.replace(/\s*!\s*important$/i, "")), [{
		prop: n.startsWith("--") ? n : n.toLowerCase(),
		value: r,
		important: i
	}];
}), Cx = (e, t, n, r) => {
	let i = 0;
	for (; i < e.length;) {
		for (; i < e.length && /\s/.test(e[i]);) i++;
		if (i >= e.length) return;
		let a = i;
		for (; a < e.length && e[a] !== "{" && e[a] !== ";";) {
			let t = e[a];
			a = t === "\"" || t === "'" ? bx(e, a) + 1 : t === "(" || t === "[" ? yx(e, a) : a + 1;
		}
		let o = e.slice(i, a).trim();
		if (a >= e.length || e[a] === ";") {
			i = a + 1;
			continue;
		}
		let s = yx(e, a), c = e.slice(a + 1, s - 1);
		if (i = s, /^@layer\b/i.test(o)) {
			let e = o.slice(6).trim();
			Cx(c, t ? `${t}.${e}` : e, n, r);
		} else if (vx.test(o)) Cx(c, t, [...n, o], r);
		else if (/^@property\b/i.test(o)) {
			let e = Sx(c).find((e) => e.prop === "inherits");
			r.inherits.set(o.slice(9).trim(), e?.value.trim() !== "false");
		} else if (o.startsWith("@")) continue;
		else {
			let e = c.replace(/[^;{}]*\{[^]*\}/g, "");
			r.rules.push({
				index: r.rules.length,
				layer: t,
				wrap: n,
				selector: o,
				decls: Sx(e)
			});
		}
	}
}, wx = Am("devtools.parseSheet")(function* (e) {
	return yield* Y(() => {
		let t = {
			rules: [],
			inherits: /* @__PURE__ */ new Map()
		};
		return Cx(e.replace(/\/\*[^]*?\*\//g, ""), "", [], t), t;
	});
}), Tx = [
	0,
	0,
	0
], Ex = (e, t) => [
	e[0] + t[0],
	e[1] + t[1],
	e[2] + t[2]
], Dx = (e, t) => e[0] - t[0] || e[1] - t[1] || e[2] - t[2], Ox = (e) => e.reduce((e, t) => Dx(t, e) > 0 ? t : e, Tx), kx = /^-?[\w-]+/, Ax = /^(is|not|has|matches)$/i, jx = (e) => {
	let t = [
		0,
		0,
		0
	];
	for (let n = 0; n < e.length;) {
		let r = e[n], i = e.slice(n + 1);
		if (r === "#") t = Ex(t, [
			1,
			0,
			0
		]), n += 1 + (kx.exec(i)?.[0].length ?? 0);
		else if (r === ".") t = Ex(t, [
			0,
			1,
			0
		]), n += 1 + (kx.exec(i)?.[0].length ?? 0);
		else if (r === "[") t = Ex(t, [
			0,
			1,
			0
		]), n = yx(e, n);
		else if (r === ":") {
			let r = e[n + 1] === ":", i = n + (r ? 2 : 1), a = kx.exec(e.slice(i))?.[0] ?? "", o = i + a.length, s = e[o] === "(" ? e.slice(o + 1, yx(e, o) - 1) : void 0;
			s !== void 0 && (o = yx(e, o)), t = r ? Ex(t, [
				0,
				0,
				1
			]) : /^where$/i.test(a) ? Ex(t, Tx) : Ax.test(a) && s !== void 0 ? Ex(t, Ox(xx(s, ",").map(jx))) : Ex(t, [
				0,
				1,
				0
			]), n = o;
		} else /[a-zA-Z]/.test(r) ? (t = Ex(t, [
			0,
			0,
			1
		]), n += kx.exec(e.slice(n))?.[0].length ?? 1) : n++;
	}
	return t;
}, Mx = /^(where|is|not|has|root|scope|host|first-child|last-child|only-child|first-of-type|last-of-type|only-of-type|empty|defined|nth-child|nth-last-child|nth-of-type|nth-last-of-type)$/i, Nx = (e, t = !1) => {
	let n = "", r = [];
	for (let i = 0; i < e.length;) {
		let a = e[i];
		if (a === "[") {
			let n = yx(e, i);
			r.push(`${t ? "within " : ""}${e.slice(i, n)}`), i = n;
		} else if (a === ":" && e[i + 1] !== ":") {
			let a = kx.exec(e.slice(i + 1))?.[0] ?? "", o = i + 1 + a.length, s = e[o] === "(", c = s ? yx(e, o) : o;
			if (Mx.test(a)) {
				if (s && /^(where|is|not|has)$/i.test(a)) {
					let i = xx(e.slice(o + 1, c - 1), ",").map((e) => Nx(e, t || /^where$/i.test(a)));
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
}, Px = class extends vs()("@cssints/devtools/core/page") {}, Fx = (e) => _x[e] ?? [e], Ix = (e) => /^@scope\b/i.test(e), Lx = /\._[\w-]/, Rx = 1e9, zx = /^(width|height|inline-size|block-size|min-width|min-height|max-width|max-height|flex-basis|grid-template-columns|grid-template-rows)$/, Bx = (e, t) => t === "" ? Rx : e.rank.get(t) ?? e.rank.get(t.split(".")[0]) ?? -1, Vx = (e, t, n) => {
	if (t.decl.important !== n.decl.important) return t.decl.important;
	let r = Bx(e, t.layer), i = Bx(e, n.layer);
	return ((t.decl.important ? i - r : r - i) || Dx(t.specificity, n.specificity) || t.rule - n.rule) > 0;
}, Hx = km(function* (e, t, n) {
	let r = yield* Px, i = e.sheet.rules.filter((e) => e.decls.length && (!n || e.decls.some((e) => e.prop === n))), a = (e) => xx(e.selector, ",").map((e) => ({
		full: e,
		...Lx.test(e) ? Nx(e) : {
			base: e,
			states: []
		}
	})), o = i.filter((e) => e.wrap.some(Ix)), s = o.flatMap((e) => {
		let t = e.wrap.filter(Ix);
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
				specificity: n.map((e) => jx(e.full)).reduce((e, t) => Dx(t, e) > 0 ? t : e),
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
		let d = (u.length ? u : s).map((e) => jx(e.full));
		l.push({
			rule: e,
			specificity: d.reduce((e, t) => Dx(t, e) > 0 ? t : e),
			matched: u.length > 0,
			states: s.flatMap((e) => e.states)
		});
	}
	let u = [...new Set(l.flatMap((e) => e.rule.wrap.filter((e) => !Ix(e))))], d = yield* r.probe(t, u.map((e) => ({ wrap: [e] }))), f = new Map(u.map((e, t) => [e, !!d[t]]));
	return l.flatMap(({ rule: e, specificity: t, matched: r, states: i }) => {
		let a = [...e.wrap.map((e) => ({
			text: e,
			holds: Ix(e) || !!f.get(e)
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
}), Ux = (e, t, n) => {
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
	} : zx.test(e.prop) ? {
		...r,
		status: "unverified",
		reason: `${e.prop} depends on the element's content and layout, which the probe does not have`
	} : {
		...r,
		status: "mismatch",
		reason: `the browser computes ${e.computed}; ${t.selector} would give ${e.expected}`
	};
}, Wx = km(function* (e, t, n) {
	let r;
	for (let i of yield* Hx(e, t, n)) i.applies && (!r || Vx(e, i, r)) && (r = i);
	return r;
}), Gx = km(function* (e, t, n) {
	let r = yield* Px, i = e.sheet.inherits.get(n) ?? !0, a = t;
	for (let t = 0; a && t < 64; t++) {
		let t = yield* Wx(e, a, n);
		if (t) return {
			selector: t.selector,
			layer: t.layer,
			wrap: t.wrap,
			on: yield* r.label(a)
		};
		if (!i) return;
		a = yield* r.parent(a);
	}
}), Kx = /var\(\s*(--[\w-]+)/g, qx = Am("devtools.inspect")(function* (e, t) {
	let n = yield* Px, { table: r } = e, i = yield* Hx(e, t), a = i.filter((e) => e.applies), o = i.filter((e) => !e.applies), s = /* @__PURE__ */ new Map();
	for (let t of a) for (let n of Fx(t.decl.prop)) {
		let r = s.get(n);
		(!r || Vx(e, t, r)) && s.set(n, t);
	}
	let c = /* @__PURE__ */ new Map();
	for (let [e, t] of s) (c.get(t) ?? c.set(t, []).get(t)).push(e);
	let l = (e, t) => Fx(e.decl.prop).some((e) => t.includes(e)), u = [];
	for (let [e, i] of c) {
		let c = (yield* n.verify(t, e.decl.prop, e.decl.value, i)).map((t) => Ux(t, e, r.root));
		u.push({
			prop: e.decl.prop,
			longhands: i,
			winner: e,
			lost: Fx(e.decl.prop).flatMap((t) => {
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
	for (let e of o) Fx(e.decl.prop).some((e) => s.has(e)) || (d.get(e.decl.prop) ?? d.set(e.decl.prop, []).get(e.decl.prop)).push(e);
	for (let [e, t] of d) u.push({
		prop: e,
		longhands: [...Fx(e)],
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
		let i = n.kind === "class" ? e.rulesOf.get(t) ?? [] : [], a = i.flatMap((e) => p.get(e) ?? []), o = i[0] === void 0 ? void 0 : e.sheet.rules[i[0]], s = o ? xx(o.selector, ",").flatMap((e) => Nx(e).states) : [];
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
	let ee = [.../* @__PURE__ */ new Set([...i.flatMap((e) => [...e.decl.value.matchAll(Kx)].map((e) => e[1])), ...f.flatMap((e) => r.classes[e]?.tokens ?? [])])].sort(), te = yield* n.custom(t, ee), ne = [];
	for (let [n, i] of ee.entries()) {
		let a = r.tokens[i], o = yield* Gx(e, t, i);
		ne.push({
			name: i,
			...a ? {
				path: a.path,
				declared: a.value
			} : {},
			computed: te[n] ?? "",
			registered: e.sheet.inherits.has(i),
			...o ? { source: o } : {}
		});
	}
	return {
		element: yield* n.label(t),
		root: r.root,
		groups: h,
		rows: u,
		tokens: ne
	};
}), Jx = "data-cssints-probe", Yx = (e) => e.ownerNode instanceof Element && (e.ownerNode.getAttribute("data-vite-dev-id") ?? "").endsWith("virtual:cssints.css"), Xx = (e, t) => rc(tc(() => e.matches(t)), () => !1), Zx = (e) => {
	let t = [...e.attributes].find((e) => e.name.startsWith("data-") && e.name !== Jx);
	return `${e.localName}${e.id ? `#${e.id}` : ""}${t ? `[${t.name}${t.value ? `="${t.value}"` : ""}]` : ""}`;
}, Qx = (e, t) => {
	if (!t.length) return [];
	let n = e.ownerDocument.createElement("style");
	n.textContent = t.map(({ wrap: e, selector: t }, n) => {
		let r = t ? `:is(${t}):where([${Jx}])` : `[${Jx}]`;
		return `${e.map((e) => `${e} {`).join(" ")} ${r} { --cssints-probe-${n}: 1 } ${"}".repeat(e.length)}`;
	}).join("\n"), e.ownerDocument.head.append(n), e.setAttribute(Jx, "");
	let r = getComputedStyle(e), i = t.map((e, t) => r.getPropertyValue(`--cssints-probe-${t}`).trim() === "1");
	return e.removeAttribute(Jx), n.remove(), i;
}, $x = (e, t) => {
	let n = [], r = e.ownerDocument.defaultView, i = (a, o, s) => {
		for (let c of a) if (c instanceof CSSStyleRule) {
			let r = c.style.getPropertyValue(t);
			r && Xx(e, c.selectorText) && n.push({
				selector: c.selectorText,
				source: o,
				layer: s,
				value: r,
				important: c.style.getPropertyPriority(t) === "important"
			}), i(c.cssRules, o, s);
		} else c instanceof CSSLayerBlockRule ? i(c.cssRules, o, s ? `${s}.${c.name}` : c.name) : c instanceof CSSMediaRule ? r?.matchMedia(c.conditionText).matches && i(c.cssRules, o, s) : c instanceof CSSSupportsRule ? CSS.supports(c.conditionText) && i(c.cssRules, o, s) : c instanceof CSSGroupingRule && i(c.cssRules, o, s);
	};
	for (let t of e.ownerDocument.styleSheets) {
		if (Yx(t)) continue;
		let e = t.ownerNode instanceof Element ? t.ownerNode : void 0, n = t.href ?? e?.getAttribute("data-vite-dev-id") ?? `<${e?.localName ?? "style"}>`, r = ic(tc(() => t.cssRules));
		r && i(r, n, "");
	}
	return n;
}, eS = /var\(\s*(--[\w-]+)/g, tS = (e, t, n, r) => {
	let i = e.cloneNode(!1);
	if (!(i instanceof Element) || !(i instanceof HTMLElement || i instanceof SVGElement)) return [];
	let a = getComputedStyle(e);
	for (let [, e] of n.matchAll(eS)) i.style.setProperty(e, a.getPropertyValue(e));
	i.style.setProperty(t, n, "important"), e.after(i);
	let o = getComputedStyle(i), s = e instanceof HTMLElement || e instanceof SVGElement ? e.style : void 0, c = e.getAnimations().length > 0, l = r.map((t) => {
		let n = a.getPropertyValue(t).trim(), r = o.getPropertyValue(t).trim();
		return {
			prop: t,
			computed: n,
			expected: r,
			inline: s?.getPropertyValue(t) ?? "",
			foreign: n === r ? [] : $x(e, t),
			animated: c
		};
	});
	return i.remove(), l;
}, nS = Tp(Px, Px.of({
	classes: (e) => Y(() => [...e.classList]),
	label: (e) => Y(() => Zx(e)),
	parent: (e) => Y(() => e.parentElement ?? void 0),
	matches: (e, t) => Y(() => Xx(e, t)),
	probe: (e, t) => Y(() => Qx(e, t)),
	custom: (e, t) => Y(() => {
		let n = getComputedStyle(e);
		return t.map((e) => n.getPropertyValue(e).trim());
	}),
	verify: (e, t, n, r) => Y(() => tS(e, t, n, r))
})), rS = Vv({
	file: zv,
	line: Jv,
	column: Jv,
	classes: Uv(zv),
	text: Lv(zv)
}), iS = Vv({
	kind: Kv([
		"class",
		"marker",
		"group"
	]),
	layer: zv,
	wrap: Uv(zv),
	prop: zv,
	css: zv,
	tokens: Uv(zv),
	plugin: Lv(zv),
	sites: Uv(Jv)
}), aS = Vv({
	root: zv,
	sheet: zv,
	layers: Uv(zv),
	classes: Hv(zv, iS),
	sites: Uv(rS),
	tokens: Hv(zv, Vv({
		path: zv,
		value: zv
	}))
}), oS = class extends rl("TableError") {}, sS = Am("devtools.toModel")(function* (e) {
	let t = yield* Fv(aS)(e).pipe(cm((e) => new oS({ message: `cssints devtools: a bad table: ${e.message}` }))), n = yield* wx(t.sheet), r = new Map(t.layers.map((e, t) => [e, t])), i = /* @__PURE__ */ new Map();
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
}), cS = "cssints:devtools", lS = "cssints:devtools:stale", uS = class extends vs()("@cssints/devtools/core/session/Transport") {}, dS = (e, t) => Zb((n) => Y(() => e.on(t, (e) => qy(n, e)))), fS = Am("devtools.session")(function* () {
	let e = yield* uS, t = yield* px(void 0), n = yield* cx(!1), r = yield* cx(!0), i = ux(r, !1).pipe(em(Y(() => e.request()))), a = Jp(function* () {
		(yield* lx(n)) && (yield* lx(r)) && (yield* i);
	});
	return yield* wm(nx(dS(e, cS), (e) => sS(e).pipe(Z((e) => gx(t, e)), om("TableError", (e) => ax(e.message))))), yield* wm(nx(dS(e, lS).pipe(ex(() => ux(r, !0)), tx("60 millis")), () => a)), {
		model: t,
		setActive: (e) => ux(n, e).pipe(em(a))
	};
}), pS = "_1hqog5g _df4eqw _1vbyxpb _120vnyk _1t8gqy5 _1nu71z9 _14o2sa1 _1a8gflu _fjx7jy _16hpt8q _6to0fc _1lwcmvy _s7rk0y _1gqyter", mS = "_1hqog5g _120vnyj _z3zdsi _13tqlfe _1ecomh", hS = "_1f14wpf _rhyb7t _33i4pm _i1h5ry _1dh9zox _1h4s3ko _16hpt8q _6to0fc _184nt68", gS = "_1hqog5g _4k81c2 _jveril _rv7stg _ndevfi _120vnyk _r0xwy4 _1a8gflu _fjx7jy _z6zrz5 _omr8bg _6to19l _dnf785", _S = "_1s47490 _1ob5z5m _g2iyum _6axxrf _4k81c2 _1t8gqy5 _1a8gflu _1fskg2z", vS = "_1wme27f _16hpt8q _1i8j81t", yS = "_i1h7gg _1kazld4 _14o2sa1 _k0i4ku _v4t4nx _fjx7jy _n5igo9 _1lwcmvy _1gmfivd", bS = "_1t8gqy5 _1fskg2z", xS = "_1q2li77 _6to0fc _17lglqt _n5339z _1n07ta0", SS = "_1jvfuo0 _g9h8t5 _v4i8ee _m367sd _v4t4nx _1k2b3pg _16hpt8q _6to0fc _1lwcmvy _1gt2bai _hyivqx", CS = "_16hpt8q _6to0fc _g9cs3h _1jjinuh _lqk467 _1waot2e _r0xwy4 _1ajqzk5 _97o3l3", wS = "_1jvfuo0 _g9h8t5 _1k2b3pg _16hpt8q _6to0fc", TS = "_1s4813v _1cl1tpz _g2iyum _1kazkiv _16hpt8q _6to0fc", ES = "_1c7it6z", DS = "_1n07ta0", OS = "_n7bsss _oir30p _i1h5ry _k0i3ql _14o2sa1 _16hpt8q _6tnzl3", kS = "_1kazn1m _1p6y9cw", AS = "_1s47490 _138gorg _g2iyum _16hpt8q", jS = "_g9ymq9 _6to0fc", MS = "_1wme27f _6to0fc _g9cs3h", NS = "_k9k5db _1n07ta0", PS = "_u6js88 _16hpt8q _6to0fc", FS = "_1lh9g66", IS = "_h3m4ra", LS = "_h3od5l", RS = "_u6js88 _h3m4ra _6to0fc", zS = "_1t8gqy5 _1n07ta0", BS = /* @__PURE__ */ k("<span>"), VS = /* @__PURE__ */ k("<div>except "), HS = /* @__PURE__ */ k("<div><div><span></span><!><!></div><!><!><!><!><!>"), US = /* @__PURE__ */ k("<span>nothing applies now"), WS = /* @__PURE__ */ k("<span><!><!>"), GS = /* @__PURE__ */ k("<div><span></span> "), KS = /* @__PURE__ */ k("<div><span>: <!></span> <span>"), qS = /* @__PURE__ */ k("<div>: <!> <span></span> <!>"), JS = /* @__PURE__ */ k("<div>"), YS = /* @__PURE__ */ k("<div data-devtools=classes><h3>Classes by call"), XS = /* @__PURE__ */ k("<div data-devtools=properties><h3>Properties"), ZS = /* @__PURE__ */ k("<div data-devtools=tokens><h3>Tokens"), QS = /* @__PURE__ */ k("<div><!><!>"), $S = /* @__PURE__ */ k("<div>no cssints call"), eC = /* @__PURE__ */ k("<button>:<!> ↗"), tC = /* @__PURE__ */ k("<pre data-call>"), nC = /* @__PURE__ */ k("<div>:<!>"), rC = /* @__PURE__ */ k("<div><span>.</span><span><!> <!></span><span>"), iC = /* @__PURE__ */ k("<div><div><span></span><span></span><span>"), aC = /* @__PURE__ */ k("<div>from <!> <!> <!> on <!>"), oC = /* @__PURE__ */ k("<button data-devtools=toggle title=\"cssints devtools (Alt+Shift+C)\">cssints"), sC = /* @__PURE__ */ k("<aside data-devtools=panel><div><span data-devtools=element></span><button data-devtools=pick title=\"pick an element\">pick</button><button title=\"parent (↑)\">↑</button><button data-devtools=close title=\"close (Esc)\">×"), cC = /* @__PURE__ */ k("<div><span>"), lC = "@layer _.k{*{box-sizing:border-box}}@layer _.a{._n5igo9{font:inherit}._14o2sa1{border:1px solid #374151}._m367sd{border:none}._1jjinuh{margin:0 0 4px}._1nu71z9{border-radius:999px}._1t8gqy5{padding:.5rem}._99b8e4{border-color:#16a34a}._k0i3ql{border-radius:3px}._k0i4ku{border-radius:4px}._k9k5db{text-decoration:line-through}._lqk467{padding:.25rem}._v4i8ee{padding:0}._13tqlfe{outline:2px solid #60a5fa}._1fskg2z{border-bottom:1px solid #374151}._1p6y9cw{border-top:1px solid #1f2937}._z6zrz5{border-left:1px solid #374151}._184nt68{white-space:nowrap}._1kazkiv{padding-block:1px}._1kazld4{padding-block:2px}._1kazn1m{padding-block:4px}._1q2li77{margin-block:0 6px}._97o3l3{white-space:pre-wrap}._g2iyum{gap:.5rem}._i1h5ry{padding-inline:4px}._i1h7gg{padding-inline:6px}._r0xwy4{overflow:auto}._120vnyj{z-index:2147483646}._120vnyk{z-index:2147483647}._138gorg{align-items:baseline}._16hpt8q{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}._17lglqt{text-transform:uppercase}._1a8gflu{background-color:#111827}._1ajqzk5{background-color:#0b1220}._1c7it6z{opacity:.5}._1cl1tpz{grid-template-columns:auto 1fr auto}._1dh9zox{background-color:#60a5fa}._1ecomh{background-color:#60a5fa1f}._1f14wpf{position:absolute}._1gt2bai{text-align:start}._1h4s3ko{color:#0b1220}._1hqog5g{position:fixed}._1i8j81t{font-weight:600}._1jvfuo0{display:block}._1k2b3pg{color:#60a5fa}._1lh9g66{color:#86efac}._1lwcmvy{cursor:pointer}._1n07ta0{color:#9ca3af}._1ob5z5m{align-items:center}._1s47490{display:flex}._1s4813v{display:grid}._1vbyxpb{bottom:12px}._1waot2e{max-height:120px}._1wme27f{flex-grow:1}._33i4pm{left:0}._4k81c2{top:0}._6axxrf{position:sticky}._6tnzl3{font-size:10px}._6to0fc{font-size:11px}._6to19l{font-size:12px}._df4eqw{right:12px}._dnf785{line-height:1.45}._fjx7jy{color:#e5e7eb}._g9cs3h{overflow-wrap:anywhere}._g9h8t5{margin-bottom:2px}._g9ymq9{color:#f9a8d4}._h3m4ra{color:#fca5a5}._h3od5l{color:#fcd34d}._jveril{right:0}._n5339z{letter-spacing:.06em}._n7bsss{display:inline-block}._ndevfi{width:min(440px,100vw)}._oir30p{margin-inline-end:4px}._omr8bg{font-family:system-ui,sans-serif}._rhyb7t{top:-20px}._rv7stg{bottom:0}._s7rk0y{opacity:.75}._u6js88{padding-inline-start:12px}._v4t4nx{background-color:#0000}._z3zdsi{pointer-events:none}}@layer _.b{._1gmfivd:hover{border-color:#60a5fa}._hyivqx:hover{text-decoration:underline}._1gqyter:hover{opacity:1}}@layer _.c,_.d,_.e;\n/*$vite$:1*/", uC = "cssints-devtools", dC = (...e) => e.filter(Boolean).join(" "), fC = (e, t) => {
	let n = Om(qx(e, t).pipe(hm(nS)));
	return Xf(n) ? n.value : String(n.cause);
}, pC = (e, t, n) => void fetch(`/__open-in-editor?file=${encodeURIComponent(`${e}:${t}:${n + 1}`)}`), mC = (e, t) => t.startsWith(`${e}/`) ? t.slice(e.length + 1) : t, hC = (e) => D(jr, {
	get each() {
		return e.of;
	},
	children: (e) => (() => {
		var t = BS();
		return M(t, () => e.text), O(() => ({
			e: j(dC(OS, e.holds && "_99b8e4 _1lh9g66")),
			t: e.holds ? "holds now" : "does not hold now"
		}), ({ e, t: n }, r) => {
			A(t, e, r?.e), n !== r?.t && ni(t, "title", n);
		}), t;
	})()
}), gC = (e) => `${e.selector}  ${e.layer || "unlayered"}`;
function _C(e) {
	let t = () => {
		let t = e.row.verdicts;
		return t.find((e) => e.status === "mismatch") ?? t.find((e) => e.status === "unverified") ?? t[0];
	};
	var n = HS(), r = n.firstChild, i = r.firstChild, a = i.nextSibling, o = a.nextSibling, s = r.nextSibling, c = s.nextSibling, l = c.nextSibling, u = l.nextSibling, d = u.nextSibling;
	return M(i, () => e.row.prop), M(r, D(Mr, {
		get when() {
			return e.row.winner;
		},
		get fallback() {
			var e = US();
			return O(() => j(dC(MS, DS)), (t, n) => {
				A(e, t, n);
			}), e;
		},
		children: (e) => (() => {
			var t = WS(), n = t.firstChild, r = n.nextSibling;
			return M(t, () => e().decl.value, n), M(t, () => e().decl.important ? " !important" : "", r), O(() => ({
				e: j(MS),
				t: e().selector,
				a: e().decl.value
			}), ({ e, t: n, a: r }, i) => {
				A(t, e, i?.e), n !== i?.t && ni(t, "data-winner", n), r !== i?.a && ni(t, "data-value", r);
			}), t;
		})()
	}), a), M(r, D(Mr, {
		get when() {
			return t();
		},
		children: (e) => (() => {
			var t = BS();
			return M(t, (() => {
				var t = Rr(() => e().status === "ok");
				return () => t() ? "✓" : e().status === "mismatch" ? "✗" : "?";
			})()), O(() => ({
				e: j(e().status === "ok" ? FS : e().status === "mismatch" ? IS : LS),
				t: e().reason ?? `computed ${e().computed}`,
				a: e().computed
			}), ({ e, t: n, a: r }, i) => {
				A(t, e, i?.e), n !== i?.t && ni(t, "title", n), r !== i?.a && ni(t, "data-computed", r);
			}), t;
		})()
	}), o), M(n, D(Mr, {
		get when() {
			return e.row.winner;
		},
		children: (e) => (() => {
			var t = GS(), n = t.firstChild;
			return n.nextSibling, M(n, () => gC(e())), M(t, D(hC, { get of() {
				return e().conditions;
			} }), null), O(() => ({
				e: j(PS),
				t: j(DS)
			}), ({ e, t: r }, i) => {
				A(t, e, i?.e), A(n, r, i?.t);
			}), t;
		})()
	}), s), M(n, D(Mr, {
		get when() {
			return e.row.lost.length;
		},
		get children() {
			var t = VS();
			return t.firstChild, M(t, () => e.row.lost.map((e) => `${e.prop} (${e.by.selector})`).join(", "), null), O(() => j(dC(PS, DS)), (e, n) => {
				A(t, e, n);
			}), t;
		}
	}), c), M(n, D(jr, {
		get each() {
			return e.row.overridden;
		},
		children: (e) => (() => {
			var t = KS(), n = t.firstChild, r = n.firstChild, i = r.nextSibling, a = n.nextSibling.nextSibling;
			return M(n, () => e.decl.prop, r), M(n, () => e.decl.value, i), M(a, () => gC(e)), O(() => ({
				e: j(PS),
				t: e.selector,
				a: j(NS),
				o: j(DS)
			}), ({ e, t: r, a: i, o }, s) => {
				A(t, e, s?.e), r !== s?.t && ni(t, "data-overridden", r), A(n, i, s?.a), A(a, o, s?.o);
			}), t;
		})()
	}), l), M(n, D(jr, {
		get each() {
			return e.row.inactive;
		},
		children: (e) => (() => {
			var t = qS(), n = t.firstChild, r = n.nextSibling, i = r.nextSibling.nextSibling, a = i.nextSibling.nextSibling;
			return M(t, () => e.decl.prop, n), M(t, () => e.decl.value, r), M(i, () => gC(e)), M(t, D(hC, { get of() {
				return e.conditions;
			} }), a), O(() => ({
				e: j(dC(PS, ES)),
				t: e.selector,
				a: j(DS)
			}), ({ e, t: n, a: r }, a) => {
				A(t, e, a?.e), n !== a?.t && ni(t, "data-inactive", n), A(i, r, a?.a);
			}), t;
		})()
	}), u), M(n, D(jr, {
		get each() {
			return e.row.verdicts.filter((e) => e.reason);
		},
		children: (e) => (() => {
			var t = JS();
			return M(t, () => e.reason), O(() => j(e.status === "mismatch" ? RS : dC(PS, LS)), (e, n) => {
				A(t, e, n);
			}), t;
		})()
	}), d), O(() => ({
		e: j(kS),
		t: e.row.prop,
		a: t()?.status ?? "none",
		o: j(AS),
		i: j(jS)
	}), ({ e, t, a, o, i: s }, c) => {
		A(n, e, c?.e), t !== c?.t && ni(n, "data-prop", t), a !== c?.a && ni(n, "data-status", a), A(r, o, c?.o), A(i, s, c?.i);
	}), n;
}
function vC(e) {
	let t = () => e.inspection;
	return [
		(() => {
			var n = YS(), r = n.firstChild;
			return M(n, D(jr, {
				get each() {
					return t().groups;
				},
				children: (n) => (() => {
					var r = QS(), i = r.firstChild, a = i.nextSibling;
					return M(r, D(Mr, {
						get when() {
							return n.site;
						},
						get fallback() {
							var e = $S();
							return O(() => j(DS), (t, n) => {
								A(e, t, n);
							}), e;
						},
						children: (n) => [D(Mr, {
							get when() {
								return !e.build;
							},
							get fallback() {
								var e = nC(), r = e.firstChild, i = r.nextSibling;
								return M(e, () => mC(t().root, n().file), r), M(e, () => n().line, i), O(() => ({
									e: j(wS),
									t: `${mC(t().root, n().file)}:${n().line}`
								}), ({ e: t, t: n }, r) => {
									A(e, t, r?.e), n !== r?.t && ni(e, "data-site", n);
								}), e;
							},
							get children() {
								var e = eC(), r = e.firstChild, i = r.nextSibling;
								return i.nextSibling, e._$$click = () => pC(n().file, n().line, n().column), M(e, () => mC(t().root, n().file), r), M(e, () => n().line, i), O(() => ({
									e: j(SS),
									t: `${mC(t().root, n().file)}:${n().line}`
								}), ({ e: t, t: n }, r) => {
									A(e, t, r?.e), n !== r?.t && ni(e, "data-site", n);
								}), e;
							}
						}), D(Mr, {
							get when() {
								return n().text;
							},
							get children() {
								var e = tC();
								return M(e, () => n().text), O(() => j(CS), (t, n) => {
									A(e, t, n);
								}), e;
							}
						})]
					}), i), M(r, D(jr, {
						get each() {
							return n.classes;
						},
						children: (e) => (() => {
							var t = rC(), n = t.firstChild;
							n.firstChild;
							var r = n.nextSibling, i = r.firstChild, a = i.nextSibling, o = a.nextSibling, s = r.nextSibling;
							return M(n, () => e.cls, null), M(r, (() => {
								var t = Rr(() => e.kind === "marker");
								return () => t() ? `marker of kernel ${e.plugin}` : Rr(() => e.kind === "group")() ? "group marker" : Rr(() => e.kind === "other")() ? "not cssints" : e.decls.map((e) => `${e.prop}: ${e.value}`).join("; ");
							})(), i), M(r, (() => {
								var t = Rr(() => !!(e.kind === "class" && e.plugin));
								return () => t() ? `  (${e.plugin})` : "";
							})(), a), M(r, D(hC, { get of() {
								return e.conditions;
							} }), o), M(s, () => e.layer), O(() => ({
								e: j(dC(TS, !e.active && "_1c7it6z")),
								t: e.cls,
								a: j(DS)
							}), ({ e, t: n, a: r }, i) => {
								A(t, e, i?.e), n !== i?.t && ni(t, "data-class", n), A(s, r, i?.a);
							}), t;
						})()
					}), a), r;
				})()
			}), null), O(() => ({
				e: j(bS),
				t: j(xS)
			}), ({ e, t }, i) => {
				A(n, e, i?.e), A(r, t, i?.t);
			}), n;
		})(),
		(() => {
			var e = XS(), n = e.firstChild;
			return M(e, D(jr, {
				get each() {
					return t().rows;
				},
				children: (e) => D(_C, { row: e })
			}), null), O(() => ({
				e: j(bS),
				t: j(xS)
			}), ({ e: t, t: r }, i) => {
				A(e, t, i?.e), A(n, r, i?.t);
			}), e;
		})(),
		D(Mr, {
			get when() {
				return t().tokens.length;
			},
			get children() {
				var e = ZS(), n = e.firstChild;
				return M(e, D(jr, {
					get each() {
						return t().tokens;
					},
					children: (e) => (() => {
						var t = iC(), n = t.firstChild, r = n.firstChild, i = r.nextSibling, a = i.nextSibling;
						return M(r, () => e.name), M(i, () => e.computed || "(not set)"), M(a, () => e.path), M(t, D(Mr, {
							get when() {
								return e.source;
							},
							get fallback() {
								var t = JS();
								return M(t, () => e.registered ? "the initial value of its @property" : "not set by cssints"), O(() => j(dC(PS, DS)), (e, n) => {
									A(t, e, n);
								}), t;
							},
							children: (e) => (() => {
								var t = aC(), n = t.firstChild.nextSibling, r = n.nextSibling.nextSibling, i = r.nextSibling.nextSibling, a = i.nextSibling.nextSibling;
								return M(t, () => e().wrap.join(" "), n), M(t, () => e().selector, r), M(t, () => e().layer || "unlayered", i), M(t, () => e().on, a), O(() => j(dC(PS, DS)), (e, n) => {
									A(t, e, n);
								}), t;
							})()
						}), null), O(() => ({
							e: j(kS),
							t: e.name,
							a: j(AS),
							o: j(jS),
							i: j(MS),
							n: j(DS)
						}), ({ e, t: o, a: s, o: c, i: l, n: u }, d) => {
							A(t, e, d?.e), o !== d?.t && ni(t, "data-token", o), A(n, s, d?.a), A(r, c, d?.o), A(i, l, d?.i), A(a, u, d?.n);
						}), t;
					})()
				}), null), O(() => ({
					e: j(bS),
					t: j(xS)
				}), ({ e: t, t: r }, i) => {
					A(e, t, i?.e), A(n, r, i?.t);
				}), e;
			}
		})
	];
}
var yC = (e) => e.firstElementChild ?? void 0;
function bC(e) {
	let [t, n] = Dr(!1), [r, i] = Dr(!1), [a, o] = Dr(), [s, c] = Dr(), [l, u] = Dr(0), d = () => r() ? a() ?? s() : s(), f = (r = !t()) => {
		n(r), i(r && !s()), e.setActive(r);
	}, p = Er(() => {
		l();
		let n = e.model(), r = d();
		return t() && n && r?.isConnected ? fC(n, r) : void 0;
	}), m = Er(() => (l(), t() ? d()?.getBoundingClientRect() : void 0));
	return nr(() => {
		let n = (t) => t.composedPath().includes(e.host), l = (e) => {
			r() && !n(e) && e.target instanceof Element && e.target !== a() && o(e.target);
		}, d = (e) => {
			r() && !n(e) && e.target instanceof Element && (e.preventDefault(), e.stopPropagation(), c(e.target), i(!1));
		}, p = (n) => {
			if (n.altKey && n.shiftKey && n.code === "KeyC") {
				n.preventDefault(), f();
				return;
			}
			if (!t()) return;
			if (n.key === "Escape") {
				n.preventDefault(), r() && s() ? i(!1) : f(!1);
				return;
			}
			let a = s();
			if (!a || r()) return;
			let o = n.key === "ArrowUp" ? a.parentElement ?? void 0 : n.key === "ArrowDown" ? yC(a) : n.key === "ArrowLeft" ? a.previousElementSibling ?? void 0 : n.key === "ArrowRight" ? a.nextElementSibling ?? void 0 : void 0;
			o && o !== e.host && (n.preventDefault(), c(o));
		}, m = setInterval(() => t() && u((e) => e + 1), 600);
		return document.addEventListener("pointermove", l, !0), document.addEventListener("click", d, !0), window.addEventListener("keydown", p, !0), () => {
			clearInterval(m), document.removeEventListener("pointermove", l, !0), document.removeEventListener("click", d, !0), window.removeEventListener("keydown", p, !0);
		};
	}), Zn(() => e.setActive(!1)), nr(() => {
		e.build && f(!0);
	}), [
		(() => {
			var e = oC();
			return e._$$click = () => f(), O(() => j(pS), (t, n) => {
				A(e, t, n);
			}), e;
		})(),
		D(Mr, {
			get when() {
				return m();
			},
			children: (e) => (() => {
				var t = cC(), n = t.firstChild;
				return M(n, (() => {
					var e = Rr(() => typeof p() == "object");
					return () => e() ? p().element : "";
				})()), O(() => ({
					e: j(mS),
					t: `${e().top}px`,
					a: `${e().left}px`,
					o: `${e().width}px`,
					i: `${e().height}px`,
					n: j(hS)
				}), ({ e, t: r, a: i, o: a, i: o, n: s }, c) => {
					A(t, e, c?.e), r !== c?.t && ri(t, "top", r), i !== c?.a && ri(t, "left", i), a !== c?.o && ri(t, "width", a), o !== c?.i && ri(t, "height", o), A(n, s, c?.n);
				}), t;
			})()
		}),
		D(Mr, {
			get when() {
				return t();
			},
			get children() {
				var t = sC(), n = t.firstChild, a = n.firstChild, o = a.nextSibling, s = o.nextSibling, l = s.nextSibling;
				return M(a, (() => {
					var e = Rr(() => typeof p() == "object");
					return () => e() ? p().element : "pick an element";
				})()), o._$$click = () => i(!r()), s._$$click = () => c((e) => e?.parentElement ?? e), l._$$click = () => f(!1), M(t, D(Mr, {
					get when() {
						return e.model();
					},
					get fallback() {
						var t = JS();
						return M(t, () => e.build ? "loading the table…" : "waiting for the dev server…"), O(() => j(zS), (e, n) => {
							A(t, e, n);
						}), t;
					},
					get children() {
						return D(Mr, {
							get when() {
								return Rr(() => typeof p() == "object")() ? p() : void 0;
							},
							get fallback() {
								var e = JS();
								return M(e, (() => {
									var e = Rr(() => typeof p() == "string");
									return () => e() ? p() : "hover an element and click to pick it";
								})()), O(() => j(zS), (t, n) => {
									A(e, t, n);
								}), e;
							},
							children: (t) => D(vC, {
								get inspection() {
									return t();
								},
								get build() {
									return e.build;
								}
							})
						});
					}
				}), null), O(() => ({
					e: j(gS),
					t: j(_S),
					a: j(vS),
					o: j(dC(yS, r() && "_1dh9zox _1h4s3ko")),
					i: r() ? "yes" : "no",
					n: j(yS),
					s: j(yS)
				}), ({ e, t: r, a: i, o: c, i: u, n: d, s: f }, p) => {
					A(t, e, p?.e), A(n, r, p?.t), A(a, i, p?.a), A(o, c, p?.o), u !== p?.i && ni(o, "data-on", u), A(s, d, p?.n), A(l, f, p?.s);
				}), t;
			}
		})
	];
}
function xC(e) {
	if (document.querySelector(uC)) return;
	let t = document.createElement(uC);
	t.setAttribute("style", "all: initial");
	let n = t.attachShadow({ mode: "open" }), r = document.createElement("style");
	r.textContent = lC;
	let i = document.createElement("div");
	n.append(r, i), document.documentElement.append(t);
	let a = Dm(fS().pipe(gm(uS, e))), [o, s] = Dr();
	Tm(nx(mx(a.model), (e) => Y(() => s(() => e)))), Gr(() => D(bC, {
		model: o,
		setActive: (e) => Dm(a.setActive(e)),
		host: t,
		get build() {
			return e.build;
		}
	}), i);
}
qr(["click"]);
//#endregion
export { xC as mount };
