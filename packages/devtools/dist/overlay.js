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
	qn(e, t.effect || t, t.error, {
		user: !0,
		...n
	});
}
function nr(e, t, n) {
	qn(e, t, void 0, n);
}
function rr(e) {
	let t = Ct();
	t && !(t.C & 16) ? Xn(() => gn(e), void 0) : C.enqueue(2, function t() {
		if (v.EE >= v.ln) return C.enqueue(2, t);
		e();
	});
}
//#endregion
//#region ../../node_modules/.bun/@solidjs+signals@2.0.0-rc.13/node_modules/@solidjs/signals/dist/prod/store/store.js
var ir = Symbol(0), ar = Symbol(0);
function or(e) {
	return Reflect.ownKeys(e).filter((t) => Object.prototype.propertyIsEnumerable.call(e, t));
}
//#endregion
//#region ../../node_modules/.bun/@solidjs+signals@2.0.0-rc.13/node_modules/@solidjs/signals/dist/prod/map.js
function sr(e, t, n) {
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
	}, s = an(dr.bind(o), void 0);
	return o.ie.qn = s, s.C &= -33, Qn(s);
}
var cr = { ownedWrite: !0 };
function lr(e, t, n, r) {
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
	return ur(e, t, n, o, s, c);
}
function ur(e, t, n, r, i, a) {
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
function dr() {
	let e = this.Ot() || [], t = e.length;
	return e[ir], Gn(this.ie, () => {
		let n, r, i, a, o = this.jt ? this.gt ? () => (i[r] = fn(e[r], cr), this.At(Qn(i[r]), r)) : () => (i[r] = fn(e[r], cr), a && (a[r] = fn(r, cr)), this.At(Qn(i[r]), a ? Qn(a[r]) : void 0)) : this.kt ? () => {
			let t = e[r];
			return a[r] = fn(r, cr), this.At(t, Qn(a[r]));
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
			for (s = 0, c = Math.min(this.wt, t); s < c && (this.yt[s] === e[s] || this.jt && fr(this.Kn, this.yt[s], e[s])); s++) this.jt && g(this.jt[s], e[s]);
			for (c = this.wt - 1, l = t - 1; c >= s && l >= s && (this.yt[c] === e[l] || this.jt && fr(this.Kn, this.yt[c], e[l])); c--, l--);
			if (s === t && this.wt === t) {
				this.yt = e.slice(0);
				return;
			}
			if (t <= this.wt && c - s > 64 && this.jt === void 0 && this.kt === void 0) {
				let n = s + (l - s >> 1), r = e[n], i = Math.min(c, n + 32), a = Math.max(s, n - 32);
				for (; a <= i && this.yt[a] !== r;) a++;
				if (a <= i && lr(this, e, t, s)) return;
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
function fr(e, t, n) {
	return !e || e(t) === e(n);
}
//#endregion
//#region ../../node_modules/.bun/@solidjs+signals@2.0.0-rc.13/node_modules/@solidjs/signals/dist/prod/boundaries.js
function pr(e, t) {
	if (typeof e == "function" && !e.length) {
		if (t?.doNotUnwrap) return e;
		do
			e = e();
		while (typeof e == "function" && !e.length);
	}
	if (!t?.skipNonRendered || e != null && e !== !0 && e !== !1 && e !== "") {
		if (Array.isArray(e)) {
			let n = [];
			return mr(e, n, t) ? () => {
				let e = [];
				return mr(n, e, {
					...t,
					doNotUnwrap: !1
				}), e;
			} : n;
		}
		return e;
	}
}
function mr(t, n = [], r) {
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
		Array.isArray(e) ? a = mr(e, n, r) || a : r?.skipNonRendered && (e == null || e === !0 || e === !1 || e === "") || n.push(e);
	} catch (t) {
		if (!(t instanceof e)) throw t;
		i = t;
	}
	if (i) throw i;
	return a;
}
var hr = Object.freeze({});
function gr(e, t) {
	return t === 3 ? (e = e()) ?? hr : e;
}
function _r(e, t) {
	let n = e.hidden;
	return typeof n == "function" ? n(t) : n.includes(t);
}
function vr(e) {
	return gr(e.source, e.kind);
}
function yr(e, t) {
	return t === 0 ? Object.keys(e) : t === 2 || e[ar] === e ? Reflect.ownKeys(e) : Object.keys(e);
}
function br(e, t) {
	if (t === 1) {
		if (e.kind === 4) return Sr(e.source, !1, e);
		let t = yr(vr(e), e.kind), n = [];
		for (let r = 0; r < t.length; r++) _r(e, t[r]) || n.push(t[r]);
		return n;
	}
	return yr(gr(e, t), t);
}
function xr(e, t) {
	if (e !== void 0) {
		for (let n = e.length - 1; n >= 0; n--) if (_r(e[n], t)) return !0;
	}
	return !1;
}
function Sr(e, t, n) {
	let r = [];
	return Cr(e, n === void 0 ? void 0 : [n], t, r, null), r;
}
function Cr(e, t, n, r, i) {
	let a = e.sources, o = e.kinds;
	for (let e = 0; e < a.length; e++) {
		let s = a[e], c = o[e], l;
		if (c === 1) {
			if (s.kind === 4) {
				t === void 0 ? t = [s] : t.push(s), Cr(s.source, t, n, r, i), t.pop();
				continue;
			}
			l = s, c = s.kind, s = s.source;
		}
		s = gr(s, c);
		let u = n ? or(s) : yr(s, c);
		for (let e = 0; e < u.length; e++) {
			let n = u[e];
			l !== void 0 && _r(l, n) || xr(t, n) || wr(r, i, n, s);
		}
	}
}
function wr(e, t, n, r) {
	let i = e.indexOf(n);
	i !== -1 && (e.splice(i, 1), t !== null && t.splice(i, 1)), e.push(n), t !== null && t.push(r);
}
//#endregion
//#region ../../node_modules/.bun/solid-js@2.0.0-rc.13/node_modules/solid-js/dist/solid.js
var Tr = !1, Er = {
	hydrating: !1,
	registry: void 0,
	done: !1
}, Dr = (...e) => er(...e), Or = (...e) => $n(...e), kr = (...e) => Dt(...e), Ar = (...e) => nr(...e), jr = (...e) => tr(...e);
function D(e, t, n) {
	return gn(() => e(t || {}));
}
var Mr = (e) => `Stale read from <${e}>.`;
function Nr(e) {
	let t = "fallback" in e ? {
		keyed: e.keyed,
		fallback: () => e.fallback
	} : { keyed: e.keyed }, n = Ct(), r, i = () => Gn(n, () => sr(() => e.each, e.children, t));
	return Er.hydrating && (r = i()), () => (r ??= i())();
}
function Pr(e) {
	let t = e.keyed, n = er(() => e.when, void 0), r = t ? n : er(n, {
		equals: (e, t) => !e == !t,
		sync: !0
	});
	return er(() => {
		let i = r();
		if (i) {
			let a = e.children;
			return typeof a == "function" && a.length > 0 ? gn(t ? () => a(i) : () => a(() => {
				if (!gn(r)) throw Mr("Show");
				return n();
			}), Tr) : a;
		}
		return e.fallback;
	}, { sync: !0 });
}
//#endregion
//#region ../../node_modules/.bun/solid-js@2.0.0-rc.13/node_modules/solid-js/dist/internal.js
var Fr = Er, Ir = /*#__PURE__*/ Symbol("slot"), Lr = /*#__PURE__*/ Symbol("host"), Rr = {
	transparent: !0,
	sync: !0
}, zr = { sync: !0 };
function O(e, t, n) {
	Ar(e, t, n ? {
		sync: !0,
		...n,
		transparent: !n.scope
	} : Rr);
}
function Br(e) {
	return Dr(() => e(), zr);
}
function Vr(e, t, n, r) {
	let i = n.length, a = t.length, o = i, s = 0, c = 0, l = t[a - 1], u = l[Ir], d = l.parentNode === e && (!u || u === r) ? l.nextSibling : r || null, f = null, p, m, h = (t) => {
		if (!t) return !1;
		let n = t[Ir];
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
					let i = n[c - 1], a = i[Ir];
					t = i.parentNode === e && (!a || a === r) ? i.nextSibling : d;
				} else t = n[o - c];
			} else t = d;
			for (; c < o;) {
				let i = n[c++];
				e.insertBefore(i, t), r && (i[Ir] = r);
			}
		} else if (o === c) for (; s < a;) {
			let n = t[s++];
			if (!f || !f.has(n)) {
				let t = n[Ir];
				n.parentNode === e && (!t || t === r) && n.remove();
			}
		}
		else if ((p = t[s]) === n[o - 1] && n[c] === t[a - 1] && p.parentNode === e && (!(m = p[Ir]) || m === r)) {
			if (r) do {
				let n = t[--a];
				if (e.insertBefore(n, p), n[Ir] = r, c++, s >= a - 1 || c >= o) break;
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
						let a = t[s], o = a[Ir], l = a.parentNode === e && (!o || o === r) ? a : d;
						for (; c < i;) {
							let t = n[c++];
							e.insertBefore(t, l), r && (t[Ir] = r);
						}
					} else {
						let i = t[s++], a = n[c++], o = i[Ir];
						i.parentNode === e && (!o || o === r) ? e.replaceChild(a, i) : e.insertBefore(a, d), r && (a[Ir] = r);
					}
				} else s++;
			} else {
				let n = t[s++], i = n[Ir];
				n.parentNode === e && (!i || i === r) && n.remove();
			}
		}
	}
}
var Hr = "_$$", Ur = "_$SOLID_EVENT_OWNER", Wr = {}, Gr = /* @__PURE__ */ new Set(), Kr = /* @__PURE__ */ new Map();
function qr(e, t, n, r = {}) {
	let i;
	Xr(t);
	try {
		kr((a) => {
			if (i = a, r.onError && (Ct()[ke] = r.onError), t === document) {
				let t = e();
				O(() => pr(t), () => {});
			} else {
				let i = e();
				M(t, () => i, t.firstChild ? null : void 0, n, {
					...r.insertOptions,
					schedule: !0
				});
			}
		}, { id: r.renderId }), Xe();
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
function k(e, t) {
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
function ii(e, t, n) {
	if (ui(e)) return;
	let r = t === "multiple" && e.localName === "select";
	if (n == null || n === !1) e.removeAttribute(t);
	else if (e.setAttribute(t, n === !0 ? "" : n), r && !e._$multiple) {
		let t = e.options;
		for (let e = 0; e < t.length; e++) t[e].defaultSelected && (t[e].selected = !0);
	}
	r && (e._$multiple = !0), ni !== null && (t === "href" || t === "action") && ri(e);
}
function A(e, t, n) {
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
function j(e) {
	if (typeof e != "object" || !e) return e;
	if (Array.isArray(e)) return e.map(j);
	if (e[ar] !== e) return e;
	let t = br(e, 2), n = {};
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
	let n = gn(e);
	Gn(null, () => oi(n, t));
}
var ci = { scope: !0 }, li = null;
function M(e, t, n, r, i) {
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
	O((r) => {
		li !== null && (s = li.reclaimRegion(s, e, n));
		let c = hi(t(), s, a, !0);
		return typeof c == "function" ? (O(() => (li !== null && (s = li.reclaimRegion(s, e, n)), hi(c, s, a)), (t) => {
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
	if (!Fr.hydrating || Fr.isClaiming && !Fr.isClaiming()) return !1;
	if (!e || e.isConnected) return !0;
	let t = Fr.claimRoots;
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
	let r = e[Ur], i;
	if (r) {
		if (r === !0 || r === t || !t.contains(r)) return;
		i = r;
	}
	let a = n && (n.owners.size === 1 && n.owners.has(t) ? t : ti(e.target, n)?.owner);
	if (n && !a || a && a === i) return;
	e[Ur] = a || !0;
	let o = i || e.target, s = Hr + e.type, c = e.target, l = a || t || e.currentTarget, u = (t) => Object.defineProperty(e, "target", {
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
	else if (t.nodeType) Array.isArray(n) ? bi(e, n, a ? r : null, t) : n != null && n.nodeType ? n.parentNode === e ? e.replaceChild(t, n) : e.appendChild(t) : n != null && e.firstChild ? e.replaceChild(t, e.firstChild) : e.appendChild(t), r && (t[Ir] = r);
	else if (Array.isArray(t)) {
		let i = Array.isArray(n);
		for (let e = 0, r = t.length; e < r; e++) {
			let r = t[e], a = typeof r;
			if (a === "string" || a === "number") {
				let a = i ? n[e] : void 0;
				a && a.nodeType === 3 ? (a.data !== "" + r && (a.data = r), t[e] = a) : t[e] = document.createTextNode(r);
			}
		}
		t.length === 0 ? bi(e, n, r) : i ? n.length === 0 ? _i(e, t, r) : Vr(e, n, t, r) : (n != null && bi(e, n), _i(e, t));
	}
	return t;
}
function hi(e, t, n, r) {
	if (e = pr(e, {
		skipNonRendered: !0,
		doNotUnwrap: r
	}), r && typeof e == "function") return e;
	if (n && !Array.isArray(e) && (e = [e ?? ""]), Fr.hydrating && Array.isArray(e)) for (let n = 0, r = e.length; n < r; n++) {
		let r = e[n], i = t && t[n], a = typeof r;
		(a === "string" || a === "number") && i && i.nodeType === 3 && ui(i) && (e[n] = i);
	}
	return e;
}
function gi(e, t) {
	if (Array.isArray(e)) for (let n = 0, r = e.length; n < r; n++) gi(e[n], t);
	else e && e.nodeType && e[Lr] !== t && (e[Lr] = t, Object.defineProperty(e, "_$host", {
		get: t,
		configurable: !0
	}));
}
function _i(e, t, n = null) {
	for (let r = 0, i = t.length; r < i; r++) {
		let i = t[r];
		e.insertBefore(i, n), n && (i[Ir] = n);
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
				let t = o[Ir], s = o.parentNode === e && (!t || t === n);
				r && !i && !a ? s ? e.replaceChild(r, o) : e.insertBefore(r, n) : s && o.remove();
			} else i = !0;
		}
	} else r && e.insertBefore(r, n);
	r && n && (r[Ir] = n);
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
}, P = (e) => e, wi = (e) => () => e, Ti = /*#__PURE__*/ wi(!0), Ei = /*#__PURE__*/ wi(!1), Di = /*#__PURE__*/ wi(void 0), Oi = Di;
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
var F = /*#__PURE__*/ N(2, (e, t) => Ui(e) && t in e), Wi = /*#__PURE__*/ N(2, (e, t) => F(e, "_tag") && e._tag === t), Gi = "~effect/Hash", I = (e) => {
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
}, Ki = (e) => (oa.has(e) || oa.set(e, Yi(Math.random() * 4294967296 | 0)), oa.get(e)), qi = (e) => (e ^= e >>> 16, e = Math.imul(e, 2246822507), e ^= e >>> 13, e = Math.imul(e, 3266489909), e ^ e >>> 16), Ji = /*#__PURE__*/ N(2, (e, t) => qi(Math.imul(e, 2654435761) + Math.imul(t, 2246822507))), Yi = (e) => e & 3221225471 | e >>> 1 & 1073741824, Xi = /*#__PURE__*/ new DataView(/*#__PURE__*/ new ArrayBuffer(8)), Zi = (e) => {
	let t = e | 0;
	return t === e ? Yi(t) : (Xi.setFloat64(0, e === e ? e : NaN), Yi(Ji(Xi.getInt32(0), Xi.getInt32(4))));
}, Qi = (e) => {
	let t = 5381, n = e.length;
	for (; n;) t = t * 33 ^ e.charCodeAt(--n);
	return Yi(t);
}, $i = (e, t) => {
	let n = 12289;
	for (let r of t) n ^= Ji(I(r), I(e[r]));
	return Yi(n);
}, ea = (e) => $i(e, ji(e)), ta = (e, t) => (n) => {
	let r = e;
	for (let e of n) r ^= t(e);
	return Yi(r);
}, na = (e) => {
	let t = 6151;
	for (let n of e) t = Ji(t, I(n));
	return Yi(t);
}, ra = /*#__PURE__*/ ta(/*#__PURE__*/ Qi("Map"), ([e, t]) => Ji(I(e), I(t))), ia = /*#__PURE__*/ Qi("Set"), aa = /*#__PURE__*/ ta(ia, (e) => Ji(ia, I(e))), oa = /*#__PURE__*/ new WeakMap(), sa = /*#__PURE__*/ new WeakMap(), ca = /*#__PURE__*/ new WeakSet(), la = "~effect/Equal";
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
	if (I(e) !== I(t)) return !1;
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
	return e instanceof Map ? !(t instanceof Map) || e.size !== t.size ? !1 : xa(e, t, Sa, Ca) : e instanceof Set ? !(t instanceof Set) || e.size !== t.size ? !1 : xa(e, t, I, da) : ba(e, t);
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
var Sa = (e) => I(e[0]), Ca = (e, t) => da(e[0], t[0]) && da(e[1], t[1]), wa = (e) => F(e, la), Ta = /*#__PURE__*/ Symbol.for("~effect/Redactable"), Ea = (e) => F(e, Ta);
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
			else if (!t?.ignoreToString && F(e, "toString") && typeof e.toString == "function" && e.toString !== Object.prototype.toString && e.toString !== Array.prototype.toString) {
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
		return e = Da(e), F(e, "toJSON") && Bi(e.toJSON) && e.toJSON.length === 0 ? e.toJSON() : Array.isArray(e) ? e.map(Ba) : e;
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
	_A: P,
	_E: P,
	_R: P
}, Qa = `${Ya}/identifier`, L = `${Ya}/args`, R = `${Ya}/evaluate`, $a = `${Ya}/successCont`, eo = `${Ya}/failureCont`, to = `${Ya}/ensureCont`, no = /*#__PURE__*/ Symbol.for("effect/Effect/Yield"), ro = {
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
			...L in this ? { args: this[L] } : void 0
		};
	}
}, ao = (e) => F(e, Ya), oo = (e) => F(e, Xa), so = "~effect/Cause", co = "~effect/Cause/Reason", lo = (e) => F(e, so), uo = class {
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
		return Ji(Qi(this._tag))(Ji(I(this.error))(I(this.annotations)));
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
		return Ji(Qi(this._tag))(Ji(I(this.defect))(I(this.annotations)));
	}
}, yo = (e) => new uo([new vo(e)]), bo = /*#__PURE__*/ N((e) => lo(e[0]), (e, t, n) => t.mapUnsafe.size === 0 ? e : new uo(e.reasons.map((e) => e.annotate(t, n)))), xo = (e) => e._tag === "Fail", So = (e) => e._tag === "Die", Co = (e) => e._tag === "Interrupt";
function wo(e) {
	return Mo("Effect.evaluate: Not implemented");
}
var To = (e) => ({
	...io,
	[Qa]: e.op,
	[R]: e[R] ?? wo,
	[$a]: e[$a],
	[eo]: e[eo],
	[to]: e[to]
}), Eo = (e) => {
	let t = To(e), n = function(e) {
		this[L] = e;
	};
	return n.prototype = t, function(e) {
		return new n(e);
	};
}, Do = (e) => {
	let t = {
		[Xa]: Xa,
		_tag: e.op,
		get [e.prop]() {
			return this[L];
		},
		...To(e),
		toString() {
			return `${e.op}(${Ma(this[L])})`;
		},
		toJSON() {
			return {
				_id: "Exit",
				_tag: e.op,
				[e.prop]: this[L]
			};
		},
		[la](e) {
			return oo(e) && e._tag === this._tag && ua(this[L], e[L]);
		},
		[Gi]() {
			return Ji(Qi(e.op), I(this[L]));
		}
	}, n = function(e) {
		this[L] = e;
	};
	return n.prototype = t, function(e) {
		return new n(e);
	};
}, z = /*#__PURE__*/ Do({
	op: "Success",
	prop: "value",
	[R](e) {
		let t = e.getCont($a);
		return t ? t[$a](this[L], e, this) : e.yieldWith(this);
	}
}), Oo = { key: "effect/Cause/StackTrace" }, ko = { key: "effect/Cause/InterruptorStackTrace" }, Ao = /*#__PURE__*/ Do({
	op: "Failure",
	prop: "cause",
	[R](e) {
		let t = this[L], n = !1;
		e.cache.stackFrame && (t = bo(t, { mapUnsafe: /* @__PURE__ */ new Map([[Oo.key, e.cache.stackFrame]]) }), n = !0);
		let r = e.getCont(eo);
		for (; e.interruptible && e._interruptedCause && r;) r = e.getCont(eo);
		return r ? r[eo](t, e, n ? void 0 : this) : e.yieldWith(n ? Ao(t) : this);
	}
}), jo = (e) => Ao(_o(e)), Mo = (e) => Ao(yo(e)), B = /*#__PURE__*/ Eo({
	op: "WithFiber",
	[R](e) {
		return this[L](e);
	}
}), No = /*#__PURE__*/ function() {
	class e extends globalThis.Error {}
	let t = /*#__PURE__*/ To({
		op: "YieldableError",
		[R]() {
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
}, Io = "~effect/Cause/Done", Lo = (e) => F(e, Io), Ro = {
	[Io]: Io,
	_tag: "Done",
	value: void 0
}, zo = (e) => e === void 0 ? Ro : {
	[Io]: Io,
	_tag: "Done",
	value: e
}, Bo = /*#__PURE__*/ jo(Ro), Vo = (e) => e === void 0 ? Bo : jo(zo(e)), Ho = (e) => To({
	op: e.label,
	[R]: e.evaluate
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
		return Ji(I(this._tag))(I(this.value));
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
} }), Ko = /*#__PURE__*/ I("None"), qo = /*#__PURE__*/ Object.assign(/*#__PURE__*/ Object.create(Wo), {
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
}), Jo = (e) => F(e, Uo), Yo = (e) => e._tag === "None", Xo = (e) => e._tag === "Some", Zo = /*#__PURE__*/ Object.create(qo), Qo = function(e) {
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
		return Ji(I(this._tag))(I(this.success));
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
		return Ji(I(this._tag))(I(this.failure));
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
}), is = (e) => F(e, es), as = (e) => e._tag === "Failure", os = (e) => e._tag === "Success", ss = function(e) {
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
var fs = /*#__PURE__*/ ds((e, t) => e < t ? -1 : 1), ps = /*#__PURE__*/ ds((e, t) => globalThis.Number.isNaN(e) && globalThis.Number.isNaN(t) ? 0 : globalThis.Number.isNaN(e) ? -1 : globalThis.Number.isNaN(t) ? 1 : e < t ? -1 : 1), ms = /*#__PURE__*/ N(2, (e, t) => ds((n, r) => e(t(n), t(r)))), hs = (e) => N(2, (t, n) => e(t, n) === 1), gs = () => Zo, _s = $o, vs = Yo, ys = Xo, bs = /*#__PURE__*/ (/* @__PURE__ */ N(2, (e, t) => vs(e) ? t() : e.value))(Di), xs = "~effect/Context/Service", Ss = function() {
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
			return z(Js(e.context, this));
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
		return B((t) => e(Js(t.context, this)));
	},
	useSync(e) {
		return B((t) => z(e(Js(t.context, this))));
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
}, Ls = (e, t) => e.cacheRoot === t.cacheRoot, Rs = (e) => F(e, Es), zs = (e) => !!e[Ts], Bs = () => Vs, Vs = /*#__PURE__*/ Fs(/*#__PURE__*/ new Map()), Hs = (e, t) => Fs(/* @__PURE__ */ new Map([[e.key, t]])), Us = /*#__PURE__*/ N(3, (e, t, n) => Ws(e, t.key, n)), Ws = (e, t, n) => {
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
}, Gs = /*#__PURE__*/ N(2, (e, t) => Ks(e, t.key)), Ks = (e, t) => {
	let n = Ps(e, t);
	return n === Ns ? void 0 : n;
}, qs = /*#__PURE__*/ N(2, (e, t) => {
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
}, Qs = /*#__PURE__*/ N(2, (e, t) => e.mapUnsafe.size === 0 ? t : t.mapUnsafe.size === 0 ? e : Ms(e, (e) => t.mapUnsafe.forEach((t, n) => e.set(n, t)))), $s = (...e) => {
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
}, oc = as, sc = /*#__PURE__*/ N(2, (e, t) => oc(e) ? t(e.failure) : e.success), cc = /*#__PURE__*/ sc(Di), lc = globalThis.Array, uc = (e) => lc.isArray(e) ? e : lc.from(e), dc = /*#__PURE__*/ N(2, (e, t) => [...e, t]);
lc.isArray;
var fc = tc, pc = tc, mc = (e) => e[e.length - 1], hc = () => [], gc = (e) => [e], _c = /*#__PURE__*/ N(2, (e, t) => e.map(t)), vc = "~effect/Duration", yc = /*#__PURE__*/ BigInt(0), bc = /*#__PURE__*/ BigInt(1), xc = /*#__PURE__*/ BigInt(2), Sc = /*#__PURE__*/ BigInt(10), Cc = /*#__PURE__*/ BigInt(1e3), wc = (e) => BigInt(e < 0 ? Math.ceil(e - .5) : Math.floor(e + .5)), Tc = (e) => wc(e * 1e6), Ec = (e, t) => {
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
				return Number.isFinite(e) ? I(wc(e)) : Zi(this.value.millis);
			}
			case "Nanos": return I(this.value.nanos);
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
}, Fc = (e) => F(e, vc), Ic = /*#__PURE__*/ Pc(0), Lc = /*#__PURE__*/ Pc(Infinity), Rc = /*#__PURE__*/ Pc(-Infinity), zc = (e) => Pc(e), Bc = (e) => Pc(e), Vc = (e) => Pc(e * 1e3), Hc = (e) => Pc(e * 6e4), Uc = (e) => Pc(e * 36e5), Wc = (e) => Pc(e * 864e5), Gc = (e) => Pc(e * 6048e5), Kc = (e) => Jc(Oc(e), {
	onMillis: P,
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
}, Jc = /*#__PURE__*/ N(2, (e, t) => {
	switch (e.value._tag) {
		case "Millis": return t.onMillis(e.value.millis);
		case "Nanos": return t.onNanos(e.value.nanos);
		case "Infinity": return t.onInfinity();
		case "NegativeInfinity": return (t.onNegativeInfinity ?? t.onInfinity)();
	}
}), Yc = /*#__PURE__*/ N(3, (e, t, n) => e.value._tag === "Infinity" || e.value._tag === "NegativeInfinity" || t.value._tag === "Infinity" || t.value._tag === "NegativeInfinity" ? n.onInfinity(e, t) : e.value._tag === "Millis" ? t.value._tag === "Millis" ? n.onMillis(e.value.millis, t.value.millis) : n.onNanos(qc(e), t.value.nanos) : n.onNanos(e.value.nanos, qc(t))), Xc = (e, t) => Yc(e, t, {
	onMillis: (e, t) => e === t,
	onNanos: (e, t) => e === t,
	onInfinity: (e, t) => e.value._tag === t.value._tag
}), Zc = /*#__PURE__*/ N(2, (e, t) => Xc(e, t)), Qc = /*#__PURE__*/ ec("effect/Scheduler", {
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
}, V = /*#__PURE__*/ Uint8Array.from("0123456789abcdef", (e) => e.charCodeAt(0)), ll = () => Math.random() * 4294967296 >>> 0, ul = () => {
	let e = ll();
	return String.fromCharCode(V[e >>> 28], V[e >>> 24 & 15], V[e >>> 20 & 15], V[e >>> 16 & 15], V[e >>> 12 & 15], V[e >>> 8 & 15], V[e >>> 4 & 15], V[e & 15]);
}, dl = () => {
	let e = ll(), t = ll();
	return String.fromCharCode(V[e >>> 28], V[e >>> 24 & 15], V[e >>> 20 & 15], V[e >>> 16 & 15], V[e >>> 12 & 15], V[e >>> 8 & 15], V[e >>> 4 & 15], V[e & 15], V[t >>> 28], V[t >>> 24 & 15], V[t >>> 20 & 15], V[t >>> 16 & 15], V[t >>> 12 & 15], V[t >>> 8 & 15], V[t >>> 4 & 15], V[t & 15]);
}, fl = () => {
	let e = ll(), t = ll(), n = ll(), r = ll();
	return String.fromCharCode(V[e >>> 28], V[e >>> 24 & 15], V[e >>> 20 & 15], V[e >>> 16 & 15], V[e >>> 12 & 15], V[e >>> 8 & 15], V[e >>> 4 & 15], V[e & 15], V[t >>> 28], V[t >>> 24 & 15], V[t >>> 20 & 15], V[t >>> 16 & 15], V[t >>> 12 & 15], V[t >>> 8 & 15], V[t >>> 4 & 15], V[t & 15], V[n >>> 28], V[n >>> 24 & 15], V[n >>> 20 & 15], V[n >>> 16 & 15], V[n >>> 12 & 15], V[n >>> 8 & 15], V[n >>> 4 & 15], V[n & 15], V[r >>> 28], V[r >>> 24 & 15], V[r >>> 20 & 15], V[r >>> 16 & 15], V[r >>> 12 & 15], V[r >>> 8 & 15], V[r >>> 4 & 15], V[r & 15]);
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
		let e = I(i), t = n.get(e);
		if (t === void 0) n.set(e, [i]);
		else if (t.some((e) => ua(e, i))) continue;
		else t.push(i);
		r.push(i);
	}
	return r;
}, Ll = /*#__PURE__*/ N(2, (e, t) => {
	if (e.reasons.length === 0) return t;
	if (t.reasons.length === 0) return e;
	let n = new uo(Il(e.reasons, t.reasons));
	return ua(e, n) ? e : n;
}), Rl = /*#__PURE__*/ N(2, (e, t) => {
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
	_A: P,
	_E: P
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
		if (n !== void 0) return this.evaluate(K(n, () => t));
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
					i = K(iu, () => e);
				}
				if (i = e.tracerContext ? e.tracerContext(i, this) : i[R](this), i === no) {
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
			return F(i, R) ? this.runLoop(Mo(e)) : Mo(`Fiber.runLoop: Not a valid effect: ${String(i)}`);
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
		if (!(++this.currentOpCount & ql - 1)) return z(e);
		let t = this.getCont($a);
		return t ? t[$a](e, this) : this.yieldWith(z(e));
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
	return t._exit ? H(t._exit) : fu((n) => t._exit ? n(H(t._exit)) : U(e.addObserver((e) => n(H(e)))));
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
		t(H(r));
	}
	return a(), U(() => i?.());
}), Ql = (e) => {
	let t = e;
	return t._exit ? t._exit : fu((n) => t._exit ? n(t._exit) : U(e.addObserver(n)));
}, $l = (e) => B((t) => eu(e, t.id)), eu = /*#__PURE__*/ N((e) => F(e[0], Bl), (e, t, n) => B((r) => {
	let i = Yl(r);
	return i = i && n ? Qs(i, n) : i ?? n, e.interruptUnsafe(t, i), Lu(Xl(e));
})), tu = (e) => B((t) => {
	let n = Yl(t), r = hc();
	for (let i of e) i.interruptUnsafe(t.id, n), r.push(i);
	return Lu(Zl(r));
}), H = z, nu = Ao, ru = jo, U = /*#__PURE__*/ Eo({
	op: "Sync",
	[R](e) {
		let t = this[L](), n = e.getCont($a);
		return n ? n[$a](t, e) : e.yieldWith(z(t));
	}
}), W = /*#__PURE__*/ Eo({
	op: "Suspend",
	[R](e) {
		return this[L]();
	}
}), iu = /*#__PURE__*/ (/* @__PURE__ */ Eo({
	op: "Yield",
	[R](e) {
		let t = !1;
		return e.currentDispatcher.scheduleTask(() => {
			t || e.evaluate(qu);
		}, this[L] ?? 0), e.yieldWith(() => {
			t = !0;
		});
	}
}))(0), au = /*#__PURE__*/ H(/*#__PURE__*/ gs()), ou = (e) => W(() => nu(e())), su = (e) => Mo(e), cu = (e) => W(() => ru(e())), G = /*#__PURE__*/ H(void 0), lu = (e) => B((t) => e(t.id)), uu = /*#__PURE__*/ function() {
	let e = /*#__PURE__*/ To({
		op: "Async",
		[R](e) {
			let t = !1, n = !1, r = this.withSignal ? new AbortController() : void 0, i = this.register.call(e.cache.scheduler, (r) => {
				t || (t = !0, n ? e.evaluate(r) : n = r);
			}, r?.signal);
			return n === !1 ? (n = !0, e._yielded = () => {
				t = !0;
			}, r === void 0 && i === void 0 || e._stack.push(du(() => (t = !0, r?.abort(), i ?? qu))), no) : n;
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
		e.interruptible && (e.interruptible = !1, e._stack.push(Yd));
	},
	[eo](e, t) {
		return Pl(e) ? K(Ed(Ao(e), this[L]()), () => nu(e)) : nu(e);
	}
}), fu = (e) => uu(e, e.length >= 2), pu = /*#__PURE__*/ fu(Oi), mu = (...e) => {
	if (e.length === 1) {
		let t = e[0];
		return W(() => Su(t()));
	}
	let [t, n] = e;
	return W(() => Su(n.call(t.self)));
}, hu = (e, ...t) => {
	let n = t.length === 0 ? function() {
		return W(() => Su(e.apply(this, arguments)));
	} : function() {
		let n = W(() => Su(e.apply(this, arguments)));
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
		let n = W(() => {
			let e = o.apply(this, arguments);
			return ao(e) ? e : Su(e);
		});
		for (let e = 0; e < r.length; e++) n = r[e](n, ...t);
		if (!ao(n)) return n;
		let l = Ua(), u;
		return l !== 0 && (Wa(2), u = new globalThis.Error(), Wa(l)), Qu(i ? kf(e, a, (e) => Af(n, e)) : n, Cl, (t) => ({
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
			if (r.done) return H(r.value);
			let i = r.value;
			if (i && i._tag === "Success") {
				n = i.value;
				continue;
			}
			if (i && i._tag === "Failure") return r.value;
			{
				let n = !0;
				return W(() => n ? (n = !1, K(r.value, (e) => Su(t, e))) : W(() => Su(e())));
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
				if (r.done) return H(r.value);
				if (!q(r.value)) return t._stack.push(this), r.value;
				if (r.value._tag === "Failure") return r.value;
				e = r.value.value;
			}
		},
		[R](e) {
			return this[$a](this.initial, e);
		}
	}), t = function(e, t) {
		this.iterator = e, this.initial = t;
	};
	return t.prototype = e, function(e, n) {
		return new t(e, n);
	};
}(), Cu = /*#__PURE__*/ N(2, (e, t) => new Eu(e, Du, H(t))), wu = function(e) {
	return e._stack.push(this), this[L];
}, Tu = /*#__PURE__*/ To({
	op: "OnSuccess",
	[R]: wu
}), Eu = function(e, t, n) {
	this[L] = e, this[$a] = t, this.payload = n;
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
}, Pu = (e) => Hu(e, _s), Fu = /*#__PURE__*/ N(2, (e, t) => new Eu(e, ao(t) ? Du : ju, t)), Iu = /*#__PURE__*/ N(2, (e, t) => new Eu(e, ao(t) ? Nu : Mu, t)), Lu = (e) => new Eu(e, Du, qu), Ru = (e, t) => B((n) => {
	let r = /* @__PURE__ */ new Set();
	return Bd(n, () => r.size === 0 ? void 0 : tu(r)), fu((i) => {
		let a = !1, o = 0;
		for (let s of e) {
			if (a) break;
			let e = o++, c = uf(n, s, !0, !0, !1);
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
}), zu = /*#__PURE__*/ N((e) => ao(e[1]), (e, t, n) => Ru([e, t], n)), K = /*#__PURE__*/ N(2, (e, t) => new Eu(e, ju, t)), q = (e) => e[Xa] !== void 0, Bu = /*#__PURE__*/ N(2, (e, t) => q(e) ? e._tag === "Success" ? t(e.value) : e : K(e, t)), Vu = (e) => K(e, P), Hu = /*#__PURE__*/ N(2, (e, t) => new Eu(e, Au, t)), Uu = /*#__PURE__*/ N(2, (e, t) => q(e) ? Ju(e, t) : Hu(e, t)), Wu = (e) => Ao(Ml(e)), Gu = (e) => e._tag === "Success", Ku = (e) => e._tag === "Failure" ? rc(e.cause) : ic(e), qu = /*#__PURE__*/ z(void 0), Ju = /*#__PURE__*/ N(2, (e, t) => e._tag === "Success" ? z(t(e.value)) : e), Yu = /*#__PURE__*/ N(2, (e, t) => Gu(e) ? t : e), Xu = (e) => {
	let t = [];
	for (let n of e) n._tag === "Failure" && t.push(...n.cause.reasons);
	return t.length === 0 ? qu : Ao(go(t));
}, Zu = /*#__PURE__*/ N(2, (e, t) => B((n) => {
	let r = n.context, i = t(r);
	return r === i ? e : (n.setContext(i), Bd(n, () => {
		n.setContext(r);
	}), e);
})), Qu = /*#__PURE__*/ N(3, (e, t, n) => Zu(e, (e) => {
	let r = qs(e, t), i = n(r);
	return r === i ? e : Us(e, t, i);
})), $u = () => ed, ed = /*#__PURE__*/ B((e) => H(e.context)), td = (e) => B((t) => e(t.context)), nd = /*#__PURE__*/ N(2, (e, t) => q(e) ? e : Zu(e, Qs(t))), rd = function() {
	return arguments.length === 1 ? N(2, (e, t) => id(e, arguments[0], t)) : N(3, (e, t, n) => id(e, t, n)).apply(this, arguments);
}, id = (e, t, n) => Zu(e, Us(t, n)), ad = /*#__PURE__*/ N(2, (e, t) => K(t, (t) => t ? Pu(e) : au)), od = /*#__PURE__*/ N((e) => ao(e[0]), (e, t) => tf({
	while: Ti,
	body: wi(t?.disableYield ? e : K(e, (e) => iu)),
	step: Oi
})), sd = /*#__PURE__*/ N(2, (e, t) => new ld(e, t.length === 1 ? t : (e) => t(e))), cd = /*#__PURE__*/ To({
	op: "OnFailure",
	[R]: wu
}), ld = function(e, t) {
	this[L] = e, this[eo] = t;
};
ld.prototype = cd;
var ud = /*#__PURE__*/ N(3, (e, t, n) => sd(e, (e) => {
	let r = t(e);
	return oc(r) ? nu(r.failure) : n(r.success, e);
})), dd = /*#__PURE__*/ N(2, (e, t) => ud(e, Nl, (e) => t(e))), fd = /*#__PURE__*/ N((e) => ao(e[0]), (e, t, n, r) => sd(e, (e) => {
	let i = Nl(e);
	return oc(i) ? nu(i.failure) : t(i.success) ? n(i.success) : r ? r(i.success) : nu(e);
})), pd = /*#__PURE__*/ N((e) => ao(e[0]), (e, t, n, r) => fd(e, Array.isArray(t) ? (e) => F(e, "_tag") && t.includes(e._tag) : Wi(t), n, r)), md = /*#__PURE__*/ N(2, (e, t) => dd(e, (e) => cu(() => t(e)))), hd = /*#__PURE__*/ N(2, (e, t) => new _d(e, t.onSuccess.length === 1 ? t.onSuccess : (e) => t.onSuccess(e), t.onFailure.length === 1 ? t.onFailure : (e) => t.onFailure(e))), gd = /*#__PURE__*/ To({
	op: "OnSuccessAndFailure",
	[R]: wu
}), _d = function(e, t, n) {
	this[L] = e, this[$a] = t, this[eo] = n;
};
_d.prototype = gd;
var vd = (e) => q(e) ? z(e) : yd(e), yd = /*#__PURE__*/ Eo({
	op: "Exit",
	[R](e) {
		return e._stack.push(this), this[L];
	},
	[$a](e, t, n) {
		return t.succeedWith(n ?? z(e));
	},
	[eo](e, t, n) {
		return t.succeedWith(n ?? Ao(e));
	}
}), bd = "~effect/Scope", xd = "~effect/Scope/Closeable", Sd = /*#__PURE__*/ Ss("effect/Scope"), Cd = (e, t) => B((n) => {
	let r = wd(e, t);
	return r === void 0 ? G : (Qd(n), r);
}), wd = (e, t) => {
	let n = e.state;
	if (n._tag === "Closed" || (e.state = {
		_tag: "Closed",
		exit: t
	}, e.parent !== void 0 && Md(e.parent, e), n._tag === "Empty")) return;
	if (n.finalizer !== void 0) return Td(n.finalizer, t);
	let r = n.finalizers;
	return r.size === 1 ? Td(r.values().next().value, t) : Dd(e, r, t);
}, Td = (e, t) => {
	try {
		return e(t);
	} catch (e) {
		return Mo(e);
	}
}, Ed = (e, t) => Gu(e) ? t : sd(t, (t) => nu(Ll(e.cause, t))), Dd = /*#__PURE__*/ hu(function* (e, t, n) {
	let r = [], i = [], a = Array.from(t.values()), o = Ul();
	for (let t = a.length - 1; t >= 0; t--) {
		let s = a[t];
		e.strategy === "sequential" ? r.push(yield* vd(Td(s, n))) : i.push(uf(o, Td(s, n), !0, !0, "inherit"));
	}
	return i.length > 0 && (r = yield* Zl(i)), yield* Xu(r);
}), Od = (e, t) => {
	let n = Pd(t, e);
	return e.state._tag === "Closed" ? (n.state = e.state, n) : (jd(e, n, (e) => Cd(n, e)), n);
}, kd = (e, t) => W(() => e.state._tag === "Closed" ? t(e.state.exit) : (jd(e, {}, t), G)), Ad = (e, t) => kd(e, wi(t)), jd = (e, t, n) => {
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
}, Md = (e, t) => {
	if (e.state._tag !== "Open") return;
	let n = e.state;
	n.finalizerKey === t ? e.state = Fd : n.finalizers !== void 0 && (n.finalizers.delete(t), n.finalizers.size === 0 && (e.state = Fd));
}, Nd = (e) => Pd(e, void 0), Pd = (e = "sequential", t) => ({
	[xd]: xd,
	[bd]: bd,
	strategy: e,
	parent: t,
	state: Fd
}), Fd = { _tag: "Empty" }, Id = /*#__PURE__*/ rd(Sd), Ld = (e) => W(() => {
	let t = Nd();
	return Vd(e(t), (e) => W(() => wd(t, e) ?? G));
}), Rd = /*#__PURE__*/ function() {
	let e = /*#__PURE__*/ To({
		op: "OnExit",
		[R](e) {
			return e._stack.push(this), this.effect;
		},
		[to](e) {
			e.interruptible && this.interruptible !== !0 && (e._stack.push(Yd), e.interruptible = !1);
		},
		[$a](e, t, n) {
			n ??= z(e);
			let r;
			try {
				r = this.onExit(n);
			} catch (e) {
				r = Mo(e);
			}
			return r ? K(r, (e) => n) : n;
		},
		[eo](e, t, n) {
			n ??= Ao(e);
			let r;
			try {
				r = this.onExit(n);
			} catch (e) {
				r = Mo(e);
			}
			return r ? K(Ed(n, r), (e) => n) : n;
		}
	}), t = function(e, t, n) {
		this.effect = e, this.onExit = t, this.interruptible = n;
	};
	return t.prototype = e, t;
}(), zd = (e, t, n) => new Rd(e, t, n), Bd = (e, t) => {
	e._stack.push(new Rd(void 0, t, void 0));
}, Vd = /*#__PURE__*/ N(2, zd), Hd = /*#__PURE__*/ N(3, (e, t, n) => Vd(e, (e) => {
	let r = t(e);
	return oc(r) ? G : n(r.success, e);
})), Ud = /*#__PURE__*/ N(2, (e, t) => Hd(e, Ku, t)), Wd = /*#__PURE__*/ N(3, (e, t, n) => Vd(e, (e) => {
	if (e._tag !== "Failure") return G;
	let r = t(e.cause);
	return oc(r) ? G : n(r.success, e.cause);
})), Gd = /*#__PURE__*/ N(2, (e, t) => Wd(Fl, t)(e)), Kd = /*#__PURE__*/ B((e) => nu(Ml(e.id))), qd = (e) => B((t) => t.interruptible ? (t.interruptible = !1, t._stack.push(Yd), e) : e), Jd = /*#__PURE__*/ Eo({
	op: "SetInterruptible",
	[to](e) {
		if (e.interruptible = this[L], e._interruptedCause && e.interruptible) return () => nu(e._interruptedCause);
	}
}), Yd = /*#__PURE__*/ Jd(!0), Xd = /*#__PURE__*/ Jd(!1), Zd = (e) => {
	if (e.interruptible = !0, e._stack.push(Xd), e._interruptedCause) return nu(e._interruptedCause);
}, Qd = (e) => {
	let t = e;
	t.interruptible && (t.interruptible = !1, t._stack.push(Yd));
}, $d = (e) => B((t) => t.interruptible ? e : Zd(t) ?? e), ef = (e) => B((t) => t.interruptible ? (t.interruptible = !1, t._stack.push(Yd), e($d)) : e(P)), tf = /*#__PURE__*/ Eo({
	op: "While",
	[$a](e, t) {
		return this[L].step(e), this[L].while() ? (t._stack.push(this), this[L].body()) : qu;
	},
	[R](e) {
		return this[L].while() ? (e._stack.push(this), this[L].body()) : qu;
	}
}), nf = /*#__PURE__*/ N((e) => typeof e[1] == "function", (e, t, n) => W(() => {
	let r = af(n?.concurrency);
	if (r === 1) return rf(e, t, n);
	let i = uc(e), a = i.length;
	if (a === 0) return n?.discard ? G : H([]);
	let o = n?.discard ? void 0 : Array(a), s = lf({
		f: t,
		out: o
	}, i, { concurrency: r });
	return s ? Cu(s, o) : H(o);
})), rf = (e, t, n) => W(() => {
	let r = n?.discard ? void 0 : [], i = e[Symbol.iterator](), a = i.next(), o = 0;
	return Cu(tf({
		while: () => !a.done,
		body: () => t(a.value, o++),
		step: (e) => {
			r && r.push(e), a = i.next();
		}
	}), r);
}), af = (e) => e === "unbounded" ? Infinity : Math.max(1, e ?? 1), of = () => (e) => {
	let t = e.onItem, n = e.step, r = (e, t, r, a, o) => K(vd(o), (o) => n(e, t[r], o, r) ?? i(e, t, r + 1, a) ?? G), i = (e, i, a = 0, o = i.length) => {
		for (; a < o; a++) {
			let s = i[a], c = t(e, s, a);
			if (!q(c)) return r(e, i, a, o, c);
			let l = n(e, s, c, a);
			if (l) return l._tag === "Failure" ? l : void 0;
		}
	};
	return i;
}, sf = (e) => {
	let t = e.onItem, n = e.step;
	return (e, r, i) => {
		let a = 0, o = i.end ?? r.length, s = i.concurrency, c = !1, l, u, d, f, p, m = (e) => {
			let t = Mo(e);
			return f = t, c = !0, u && u.size > 0 ? K(qd(tu(Array.from(u))), () => f ?? t) : t;
		}, h = () => {
			let i = !1;
			for (; !f && a < o; a++) {
				let o = r[a], g = p ?? t(e, o, a);
				if (q(g)) {
					if (f = n(e, o, g, a), f) break;
				} else if (l) {
					p = void 0;
					let t = uf(l, g, !0, !0, "inherit");
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
							} else c && u.size === 0 && d(f ?? G);
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
					return t ? e(t) : W(() => (f ??= qu, K(u ? tu(u) : G, () => f?._tag === "Failure" ? f : G)));
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
				if (u) u.size === 0 && d(G);
				else return qu;
			}
		};
		return h();
	};
}, cf = () => (e) => sf(e), lf = /*#__PURE__*/ sf({
	onItem(e, t, n) {
		return e.f(t, n);
	},
	step(e, t, n, r) {
		if (n._tag === "Failure") return n;
		e.out && (e.out[r] = n.value);
	}
}), uf = (e, t, n = !1, r = !1, i = !1) => {
	let a = e, o = i === "inherit" ? a.interruptible : !i, s = new Wl(a.context, o);
	return n ? s.evaluate(t) : a.currentDispatcher.scheduleTask(() => s.evaluate(t), 0), !r && !s._exit && (a.children().add(s), s._parent = a), s;
}, df = /*#__PURE__*/ N((e) => ao(e[0]), (e, t) => B((n) => H(uf(n, e, t?.startImmediately, !0, t?.uninterruptible)))), ff = /*#__PURE__*/ N((e) => ao(e[0]), (e, t, n) => B((r) => {
	let i = uf(r, e, n?.startImmediately, !0, n?.uninterruptible);
	if (!i._exit) {
		if (t.state._tag !== "Closed") {
			let e = {};
			jd(t, e, () => lu((e) => e === i.id ? G : $l(i))), i.addObserver(() => Md(t, e));
		} else i.interruptUnsafe(r.id, Yl(r));
	}
	return H(i);
})), pf = (e) => (t, n) => {
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
}, mf = /*#__PURE__*/ N(2, (e, t) => {
	if (e._exit) return e;
	if (t.state._tag === "Closed") return e.interruptUnsafe(e.id), e;
	let n = {};
	return jd(t, n, () => $l(e)), e.addObserver(() => Md(t, n)), e;
}), hf = /*#__PURE__*/ pf(/*#__PURE__*/ Bs()), gf = (e) => {
	let t = pf(e);
	return (e) => {
		if (q(e)) return e;
		let n = new rl("sync"), r = t(e, { scheduler: n });
		return r._dispatcher?.flush(), r._exit ?? Mo(new Bf(r));
	};
}, _f = /*#__PURE__*/ gf(/*#__PURE__*/ Bs()), vf = /*#__PURE__*/ ((e) => {
	let t = gf(e);
	return (e) => {
		let n = t(e);
		if (n._tag === "Failure") throw zl(n.cause);
		return n.value;
	};
})(/*#__PURE__*/ Bs()), yf = /*#__PURE__*/ H(!0), bf = /*#__PURE__*/ H(!1), xf = class {
	waiters = [];
	scheduled = void 0;
	_isOpen;
	constructor(e) {
		this._isOpen = e;
	}
	scheduleUnsafe(e) {
		if (this.waiters.length === 0) return yf;
		if (this.scheduled === void 0) this.scheduled = this.waiters, e.currentDispatcher.scheduleTask(this.flushScheduled, 0);
		else for (let e = 0; e < this.waiters.length; e++) this.scheduled.push(this.waiters[e]);
		return this.waiters = [], yf;
	}
	flushScheduled = () => {
		if (this.scheduled === void 0) return;
		let e = this.scheduled;
		this.scheduled = void 0;
		for (let t = 0; t < e.length; t++) e[t](qu);
	};
	flushWaiters() {
		let e = this.waiters;
		this.waiters = [], this.flushScheduled();
		for (let t = 0; t < e.length; t++) e[t](qu);
	}
	open = /*#__PURE__*/ B((e) => this._isOpen ? bf : (this._isOpen = !0, this.scheduleUnsafe(e)));
	release = /*#__PURE__*/ B((e) => this._isOpen ? bf : this.scheduleUnsafe(e));
	openUnsafe() {
		return !this._isOpen && (this._isOpen = !0, this.flushWaiters(), !0);
	}
	await = /*#__PURE__*/ fu((e) => this._isOpen ? e(G) : (this.waiters.push(e), U(() => {
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
}, Sf = (e) => new xf(e ?? !1), Cf = /*#__PURE__*/ BigInt(0), wf = {
	_tag: "Span",
	spanId: "noop",
	traceId: "noop",
	sampled: !1,
	status: {
		_tag: "Ended",
		startTime: Cf,
		endTime: Cf,
		exit: qu
	},
	attributes: /*#__PURE__*/ new Map(),
	links: [],
	kind: "internal",
	attribute() {},
	event() {},
	end() {},
	addLinks() {}
}, Tf = (e) => Object.assign(Object.create(wf), e), Ef = (e) => e ? Js(e.annotations, gl) ? e._tag === "Span" ? Ef(bs(e.parent)) : gs() : _s(e) : gs(), Df = (e, t, n) => {
	let r = !e.cache.tracerEnabled || n?.annotations && Js(n.annotations, gl), i = n?.parent === void 0 ? n?.root ? gs() : Ef(e.cache.span) : _s(n.parent), a;
	if (r) a = Tf({
		name: t,
		parent: i,
		annotations: Us(n?.annotations ?? Bs(), gl, !0)
	});
	else {
		let r = e.cache.tracer ?? bl, o = e.getRef(jf), s = e.getRef(Tl), c = e.getRef(El), l = e.getRef(Dl), u = n?.level ?? e.getRef(_l), d = n?.links === void 0 ? l.length === 0 ? [] : l.slice() : [...l, ...n.links];
		a = r.span({
			name: t,
			parent: i,
			annotations: n?.annotations ?? Bs(),
			links: d,
			startTime: s ? o.currentTimeNanosUnsafe() : Cf,
			kind: n?.kind ?? "internal",
			root: n?.root ?? vs(i),
			sampled: n?.sampled ?? (ys(i) && i.value.sampled === !1 ? !1 : !Hf(e.getRef(vl), u))
		});
		for (let e in c) a.attribute(e, c[e]);
		if (n?.attributes !== void 0) for (let e in n.attributes) a.attribute(e, n.attributes[e]);
	}
	return a;
}, Of = (e, t, n, r) => U(() => {
	e.status._tag !== "Ended" && e.end(r ? n.currentTimeNanosUnsafe() : Cf, t);
}), kf = (e, ...t) => {
	let n = t.length === 1 ? void 0 : t[0], r = t[t.length - 1];
	return B((t) => {
		let i = Df(t, e, n), a = t.getRef(jf), o = t.getRef(Tl);
		return Bd(t, (e) => Of(i, e, a, o)), r(i);
	});
}, Af = /*#__PURE__*/ rd(ml), jf = /*#__PURE__*/ ec("effect/Clock", { defaultValue: () => new Nf() }), Mf = 2 ** 31 - 1, Nf = class {
	currentTimeMillisUnsafe() {
		return Date.now();
	}
	currentTimeMillis = /*#__PURE__*/ U(() => this.currentTimeMillisUnsafe());
	currentTimeNanosUnsafe() {
		return If();
	}
	currentTimeNanos = /*#__PURE__*/ U(() => this.currentTimeNanosUnsafe());
	monotonicTimeNanosUnsafe() {
		return Ff();
	}
	monotonicTimeNanos = /*#__PURE__*/ U(() => this.monotonicTimeNanosUnsafe());
	sleep(e) {
		return this.sleepMillis(Kc(e));
	}
	sleepMillis(e) {
		return e <= 0 ? iu : Number.isFinite(e) ? fu((t) => {
			let n = e > Mf ? this.sleepMillis(e - Mf) : G, r = setTimeout(() => t(n), Math.min(e, Mf));
			return U(() => clearTimeout(r));
		}) : pu;
	}
}, Pf = /*#__PURE__*/ BigInt(1e6), Ff = /*#__PURE__*/ function() {
	let e = globalThis.process?.hrtime;
	if (typeof e?.bigint == "function") return () => e.bigint();
	if (typeof performance < "u" && typeof performance.now == "function") return () => BigInt(Math.round(performance.now() * 1e6));
	let t = /*#__PURE__*/ BigInt(0);
	return () => {
		let e = BigInt(Date.now()) * Pf;
		return e > t && (t = e), t;
	};
}(), If = /*#__PURE__*/ function() {
	let e = /*#__PURE__*/ BigInt(1e9), t;
	return () => {
		let n = Ff(), r = BigInt(Date.now()) * Pf;
		if (t === void 0) t = r - n;
		else {
			let i = t + n;
			(r > i ? r - i : i - r) > e && (t = r - n);
		}
		return t + n;
	};
}(), Lf = (e) => B((t) => e(t.getRef(jf))), Rf = (e) => Lf((t) => t.sleep(Oc(e))), zf = "~effect/Cause/AsyncFiberError", Bf = class extends (/*#__PURE__*/ Fo("AsyncFiberError")) {
	[zf] = zf;
	constructor(e) {
		super({
			message: "An asynchronous Effect was executed with Effect.runSync",
			fiber: e
		});
	}
}, Vf = /*#__PURE__*/ ec("effect/Console", { defaultValue: () => globalThis.console }), Hf = /*#__PURE__*/ hs(/* @__PURE__ */ ms(ps, (e) => {
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
})), Uf = {
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
Uf.gray, Uf.blue, Uf.green, Uf.yellow, Uf.red, Uf.bgBrightRed, Uf.black;
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/Cause.js
var Wf = xo, Gf = go, Kf = yo, qf = Rl, Jf = Lo, Yf = Vo, Xf = z, Zf = Ao, Qf = jo, $f = qu, ep = Gu, tp = {
	"~effect/Deferred": {
		_A: P,
		_E: P
	},
	pipe() {
		return xi(this, arguments);
	}
}, np = function() {
	this.resumes = void 0, this.effect = void 0;
};
np.prototype = tp;
var rp = () => new np(), ip = (e) => fu((t) => e.effect ? t(e.effect) : (e.resumes ??= [], e.resumes.push(t), U(() => {
	let n = e.resumes;
	if (n === void 0) return;
	let r = n.indexOf(t);
	r >= 0 && n.splice(r, 1);
}))), ap = /* @__PURE__ */ N(2, (e, t) => U(() => cp(e, t))), op = /*#__PURE__*/ N(2, (e, t) => ap(e, Ao(t))), sp = /*#__PURE__*/ N(2, (e, t) => op(e, Ml(t))), cp = (e, t) => {
	if (e.effect) return !1;
	if (e.effect = t, e.resumes) {
		let n = e.resumes;
		e.resumes = void 0;
		for (let e = 0; e < n.length; e++) n[e](t);
	}
	return !0;
}, lp = Sd, up = Nd, dp = Id, fp = kd, pp = Ad, mp = Od, hp = Cd, gp = "~effect/Layer", _p = "~effect/Layer/MemoMap", vp = (e, t) => {
	let n = {
		observers: 0,
		deferred: rp(),
		scope: up(),
		finalizer: (r) => W(() => --n.observers > 0 ? G : (e.map.delete(t), hp(n.scope, r)))
	};
	return n;
}, yp = (e, t) => t.state._tag !== "Closed" && (e.observers++, jd(t, {}, e.finalizer), !0), bp = {
	[gp]: {
		_ROut: P,
		_E: P,
		_RIn: P
	},
	pipe() {
		return xi(this, arguments);
	}
}, xp = (e) => {
	let t = Object.create(bp);
	return t.build = e, t;
}, Sp = (e) => xp((t, n) => {
	let r = mp(n);
	return Vd(e(t, r), (e) => e._tag === "Failure" ? hp(r, e) : G);
}), Cp = class {
	get [_p]() {
		return _p;
	}
	parent;
	constructor(e) {
		this.parent = e;
	}
	map = /*#__PURE__*/ new Map();
	get(e, t) {
		let n = this.map.get(e);
		return n ? (yp(n, t), n.deferred.effect ?? ip(n.deferred)) : this.parent?.get(e, t);
	}
	getOrElseMemoize(e, t, n) {
		return W(() => {
			let r;
			return zd(W(() => {
				let i = this.get(e, t);
				if (i) return i;
				let a = vp(this, e);
				return yp(a, t) ? (r = a.deferred, this.map.set(e, a), n(this, a.scope)) : n(this, t);
			}), (e) => {
				r && cp(r, e);
			});
		});
	}
}, wp = () => new Cp(), Tp = (e) => new Cp(e), Ep = class e extends (/*#__PURE__*/ Ss()("effect/Layer/CurrentMemoMap")) {
	static forkOrCreate(t) {
		let n = Gs(t, e);
		return n ? Tp(n) : wp();
	}
}, Dp = /*#__PURE__*/ N(3, (e, t, n) => rd(Hu(e.build(t, n), Us(Ep, t)), Ep, t)), Op = /*#__PURE__*/ N(2, (e, t) => B((n) => Dp(e, Ep.forkOrCreate(n.context), t))), kp = function() {
	return arguments.length === 1 ? (e) => Ap(Hs(arguments[0], e)) : Ap(Hs(arguments[0], arguments[1]));
}, Ap = (e) => xp(wi(H(e))), jp = (e, t, n) => {
	let r = mp(n, "parallel");
	return nf(e, (e) => e.build(t, mp(r, "sequential")), { concurrency: e.length }).pipe(Hu((e) => $s(...e)));
}, Mp = (...e) => Sp((t, n) => jp(e, t, n)), Np = jf, Pp = "~effect/DateTime", Fp = "~effect/DateTime/TimeZone", Ip = {
	[Pp]: Pp,
	pipe() {
		return xi(this, arguments);
	},
	[za]() {
		return this.toString();
	},
	toJSON() {
		return Rp(this).toJSON();
	}
};
({ ...Ip }), { ...Ip };
var Lp = {
	[Fp]: Fp,
	[za]() {
		return this.toString();
	}
};
({ ...Lp }), { ...Lp };
var Rp = (e) => new Date(e.epochMilliseconds), zp = /*#__PURE__*/ N(2, (e, t) => ud(e, Up, (e) => t(e))), Bp = (e) => e.reasons.some(Vp), Vp = (e) => e._tag === "Fail" && Jf(e.error), Hp = (e) => {
	let t, n = !1;
	for (let r of e.reasons) Vp(r) ? t ??= r.error : r._tag !== "Interrupt" && (n = !0);
	return t === void 0 ? ic(e) : n ? ic(Gf(e.reasons.filter((e) => !Vp(e)))) : rc(t);
}, Up = (e) => {
	let t = Hp(e);
	return oc(t) ? t : rc(t.success.value);
}, Wp = (e) => {
	let t = Hp(e);
	return oc(t) ? Zf(t.failure) : Xf(t.success.value);
}, Gp = (e, t, n) => Ld((r) => K(n?.local ? Dp(t, wp(), r) : Op(t, r), (t) => nd(e, t))), Kp = /*#__PURE__*/ N((e) => ao(e[0]), (e, t, n) => Rs(t) ? nd(e, t) : Gp(e, Array.isArray(t) ? Mp(...t) : t, n)), qp = nf, Jp = tf, J = H, Yp = W, Y = U, Xp = G, Zp = fu, Qp = mu, X = ru, $p = nu, em = ou, tm = su, nm = B, Z = K, rm = Vu, im = Fu, am = Iu, om = vd, sm = Hu, cm = Cu, lm = Lu, um = pd, dm = sd, fm = md, pm = Rf, mm = zu, hm = ad, gm = hd, _m = $u, vm = td, ym = Kp, bm = rd, xm = Ud, Sm = Vd, Cm = Kd, wm = Gd, Tm = qd, Em = od, Dm = ff, Om = df, km = hf, Am = pf, jm = vf, Mm = _f, Nm = hu, Pm = vu, Fm = Uu, Im = Bu, Lm = bu, Rm = "~effect/BigDecimal", zm = {
	[Rm]: Rm,
	[Gi]() {
		let e = qm(this);
		return Ji(Qi(String(e.value)), Zi(e.scale));
	},
	[la](e) {
		return Bm(e) && Qm(this, e) === 0;
	},
	toString() {
		return `BigDecimal(${eh(this)})`;
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
}, Bm = (e) => F(e, Rm), Vm = (e, t) => {
	if (!Number.isSafeInteger(t)) throw RangeError(`Scale must be a safe integer, got ${t}`);
	let n = Object.create(zm);
	return n.value = e, n.scale = t, n;
}, Hm = (e, t) => {
	let n = Vm(e, t);
	return n.normalized = n, n;
}, Um = /*#__PURE__*/ BigInt(0), Wm = /*#__PURE__*/ BigInt(1), Gm = /*#__PURE__*/ BigInt(10), Km = /*#__PURE__*/ Hm(Um, 0), qm = (e) => {
	if (e.normalized === void 0) {
		if (e.value === Um) e.normalized = Km;
		else {
			let t = `${e.value}`, n = t.length;
			for (; t[n - 1] === "0";) n--;
			e.normalized = Hm(BigInt(t.slice(0, n)), e.scale - (t.length - n));
		}
	}
	return e.normalized;
}, Jm = 100, Ym = [Wm], Xm = (e, t) => e === t ? 0 : e < t ? -1 : 1, Zm = (e, t) => {
	let n = `${e.value < Um ? -e.value : e.value}`, r = `${t.value < Um ? -t.value : t.value}`, i = BigInt(n.length - r.length) - BigInt(e.scale) + BigInt(t.scale);
	if (i !== Um) return i < Um ? -1 : 1;
	let a = Math.max(n.length, r.length);
	return fs(n.padEnd(a, "0"), r.padEnd(a, "0"));
}, Qm = (e, t) => {
	if (e.scale === t.scale) return Xm(e.value, t.value);
	let n = $m(e), r = $m(t);
	if (n !== r) return n < r ? -1 : 1;
	if (n === 0) return 0;
	let i = e.scale - t.scale, a = Math.abs(i);
	if (a > Jm) return n === -1 ? Zm(t, e) : Zm(e, t);
	let o = Ym[a] ??= Gm ** BigInt(a);
	return i > 0 ? Xm(e.value, t.value * o) : Xm(e.value * o, t.value);
}, $m = (e) => e.value === Um ? 0 : e.value < Um ? -1 : 1, eh = (e) => {
	let t = qm(e);
	if (Math.abs(t.scale) >= 16) return th(t);
	let n = t.value < Um, r = `${n ? -t.value : t.value}`, i = t.scale > 0 ? r.padStart(t.scale + 1, "0") : r.padEnd(r.length - t.scale, "0"), a = i.length - t.scale, o = t.scale > 0 ? `${i.slice(0, a)}.${i.slice(a)}` : i;
	return n ? `-${o}` : o;
}, th = (e) => {
	if (nh(e)) return "0e+0";
	let t = qm(e), n = `${t.value}`, r = t.value < Um ? 2 : 1, i = n.slice(0, r), a = n.slice(r), o = a.length - t.scale;
	return `${i}${a === "" ? "" : `.${a}`}e${o >= 0 ? "+" : ""}${o}`;
}, nh = (e) => e.value === Um, rh = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", ih = /*#__PURE__*/ (/* @__PURE__ */ new Uint8Array(123)).fill(255);
for (let e = 0; e < 64; e++) ih[/*#__PURE__*/ rh.charCodeAt(e)] = e;
ih[61] = 0, { ...Va }, { ...Va }, { ...ro };
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/internal/schema/annotations.js
function ah(e) {
	return e.checks ? e.checks[e.checks.length - 1].annotations : e.annotations;
}
var oh = "~sentinels", sh = "~constructor", ch = /*#__PURE__*/ ki((e) => {
	let t = ah(e)?.identifier;
	return typeof t == "string" ? t : e.getExpected(ch);
}), Q = /*#__PURE__*/ Symbol(), lh = Xf, uh = /*#__PURE__*/ lh(Q), $ = /*#__PURE__*/ lh(Q), dh = (e) => e === Q ? gs() : _s(e), fh = (e) => e._tag === "None" ? uh : lh(e.value), ph = "~effect/SchemaIssue/Issue";
function mh(e) {
	return F(e, ph) && e[ph] === ph;
}
function hh(e) {
	return Object.hasOwn(e, "input");
}
var gh = class {
	[ph] = ph;
	constructor(e, t) {
		t?.reportInput === !0 && e !== Q && (this.input = e);
	}
}, _h = class extends gh {
	_tag = "Filter";
	filter;
	issue;
	constructor(e, t, n, r) {
		super(n, r), this.filter = e, this.issue = t;
	}
}, vh = class extends gh {
	_tag = "Encoding";
	ast;
	issue;
	constructor(e, t, n, r) {
		super(n, r), this.ast = e, this.issue = t;
	}
}, yh = class extends gh {
	_tag = "Pointer";
	path;
	issue;
	constructor(e, t) {
		super(), this.path = e, this.issue = t;
	}
}, bh = class extends gh {
	_tag = "MissingKey";
	annotations;
	constructor(e) {
		super(), this.annotations = e;
	}
}, xh = class extends gh {
	_tag = "UnexpectedKey";
	ast;
	constructor(e, t, n) {
		super(t, n), this.ast = e;
	}
}, Sh = class extends gh {
	_tag = "Composite";
	ast;
	issues;
	constructor(e, t, n, r) {
		super(n, r), this.ast = e, this.issues = t;
	}
}, Ch = class extends gh {
	_tag = "InvalidType";
	ast;
	constructor(e, t, n) {
		super(t, n), this.ast = e;
	}
}, wh = class extends gh {
	_tag = "InvalidValue";
	annotations;
	constructor(e, t, n) {
		super(t, n), this.annotations = e;
	}
}, Th = class extends gh {
	_tag = "AnyOf";
	ast;
	issues;
	constructor(e, t, n, r) {
		super(n, r), this.ast = e, this.issues = t;
	}
}, Eh = class extends gh {
	_tag = "OneOf";
	ast;
	successes;
	constructor(e, t, n, r) {
		super(n, r), this.ast = e, this.successes = t;
	}
};
function Dh(e, t, n) {
	if (mh(e)) return e;
	if (typeof e == "string") return new wh({ message: e }, t, n);
	let r = typeof e.issue == "string" ? new wh({ message: e.issue }, t, n) : e.issue;
	return new yh(e.path, r);
}
function Oh(e, t, n) {
	if (e !== void 0) return typeof e == "boolean" ? e ? void 0 : new wh(void 0, t, n) : Dh(e, t, n);
}
function kh(e, t, n, r) {
	return Array.isArray(t) ? pc(t) ? t.length === 1 ? Dh(t[0], n, r) : new Sh(e, _c(t, (e) => Dh(e, n, r)), n, r) : void 0 : Oh(t, n, r);
}
var Ah = (e) => {
	let t = zh(e);
	if (t !== void 0) return t;
	switch (e._tag) {
		case "InvalidType": return Ph(ch(e.ast), e);
		case "InvalidValue": {
			let t = Nh(e);
			if (t !== void 0) return Ph(t, e);
			let n = Mh(e);
			return n === void 0 ? "Expected a valid value" : `Invalid data ${n}`;
		}
		case "MissingKey": return "Missing key";
		case "UnexpectedKey": {
			let t = Mh(e);
			return t === void 0 ? "Expected no excess property" : `Unexpected key with value ${t}`;
		}
		case "Forbidden": return "Forbidden operation";
		case "OneOf": {
			let t = Mh(e);
			return t === void 0 ? "Expected exactly one member to match" : `Expected exactly one member to match the input ${t}`;
		}
	}
}, jh = (e) => zh(e.issue) ?? zh(e);
function Mh(e) {
	return hh(e) ? Ma(e.input) : void 0;
}
function Nh(e) {
	let t = e.annotations?.expected;
	return typeof t == "string" ? t : void 0;
}
function Ph(e, t) {
	let n = Mh(t);
	return n === void 0 ? `Expected ${e}` : `Expected ${e}, got ${n}`;
}
function Fh(e) {
	let t = e.annotations?.expected;
	if (typeof t == "string") return t;
	switch (e._tag) {
		case "Filter": return "<filter>";
		case "FilterGroup": return e.checks.map((e) => Fh(e)).join(" & ");
	}
}
function Ih() {
	return (e) => Rh(e, "");
}
var Lh = /*#__PURE__*/ Ih();
function Rh(e, t) {
	let n;
	switch (e._tag) {
		case "Filter": {
			let r = jh(e);
			if (r !== void 0) n = r;
			else {
				if (e.issue._tag !== "InvalidValue") return Rh(e.issue, t);
				let r = Nh(e.issue);
				n = r === void 0 ? Ph(Fh(e.filter), e) : Ph(r, e.issue);
			}
			break;
		}
		case "Encoding": return Rh(e.issue, t);
		case "Pointer": return Rh(e.issue, t + Fa(e.path));
		case "Composite":
		case "AnyOf":
			if (e._tag === "Composite" || e.issues.length > 0) return e.issues.map((e) => Rh(e, t)).join("\n");
			n = zh(e) ?? Ph(ch(e.ast), e);
			break;
		default: n = Ah(e);
	}
	return t ? `${n}\n  at ${t}` : n;
}
function zh(e) {
	if (e._tag === "Pointer") return;
	if (e._tag === "Encoding") return zh(e.issue);
	let t = (e._tag === "Filter" ? e.filter.annotations : "annotations" in e ? e.annotations : e.ast.annotations)?.[e._tag === "MissingKey" ? "messageMissingKey" : e._tag === "UnexpectedKey" ? "messageUnexpectedKey" : "message"];
	if (typeof t == "string") return t;
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/internal/schema/cause.js
function Bh(e) {
	let t;
	for (let n of e.reasons) {
		if (!Wf(n) || !mh(n.error)) return;
		t ??= n.error;
	}
	return t;
}
function Vh(e, t) {
	let n = Bh(e);
	if (n === void 0) throw Error(t, { cause: e });
	return n;
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/SchemaGetter.js
var Hh = (e) => Object.assign(Object.create(Si), e), Uh = /*#__PURE__*/ Hh({ _tag: "Passthrough" });
function Wh() {
	return Uh;
}
function Gh(e) {
	return Hh({
		_tag: "Transform",
		transform: e
	});
}
function Kh() {
	return Gh(globalThis.String);
}
function qh() {
	return Gh(globalThis.Number);
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/SchemaTransformation.js
var Jh = class extends Ci {
	_tag = "Middleware";
	decode;
	encode;
	constructor(e, t) {
		super(), this.decode = e, this.encode = t;
	}
	flip() {
		return new Jh(this.encode, this.decode);
	}
}, Yh = "~effect/SchemaTransformation/Transformation", Xh = class extends Ci {
	[Yh] = Yh;
	_tag = "Transformation";
	decode;
	encode;
	constructor(e, t) {
		super(), this.decode = e, this.encode = t;
	}
	flip() {
		return new Xh(this.encode, this.decode);
	}
};
function Zh(e) {
	return F(e, Yh) && e[Yh] === Yh;
}
var Qh = (e) => Zh(e) ? e : new Xh(e.decode, e.encode), $h = /*#__PURE__*/ new Xh(/*#__PURE__*/ Wh(), /*#__PURE__*/ Wh());
function eg() {
	return $h;
}
var tg = /*#__PURE__*/ new Xh(/*#__PURE__*/ qh(), /*#__PURE__*/ Kh());
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/SchemaAST.js
function ng(e) {
	return (t) => t._tag === e;
}
var rg = /*#__PURE__*/ ng("Declaration"), ig = /*#__PURE__*/ ng("Never"), ag = /*#__PURE__*/ ng("Literal"), og = /*#__PURE__*/ ng("UniqueSymbol"), sg = /*#__PURE__*/ ng("Arrays"), cg = /*#__PURE__*/ ng("Objects"), lg = /*#__PURE__*/ ng("Suspend"), ug = class {
	to;
	transformation;
	constructor(e, t) {
		this.to = e, this.transformation = t;
	}
}, dg = {}, fg = class {
	isOptional;
	isMutable;
	constructorDefault;
	annotations;
	constructor(e, t, n = void 0, r = void 0) {
		this.isOptional = e, this.isMutable = t, this.constructorDefault = n, this.annotations = r;
	}
}, pg = "~effect/Schema", mg = class {
	[pg] = pg;
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
}, hg = class extends mg {
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
		return (t, n) => t === Q ? uh : (e ??= this.run(this.typeParameters))(t, this, n);
	}
	_rebuild(e, t, n, r, i) {
		let a = k_(this.typeParameters, e);
		return a === this.typeParameters && t === this.checks && n === this.encodingChecks && r === this.run && i === this.encodingRun ? this : new hg(a, r, this.annotations, t, void 0, this.context, n, i);
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
}, gg = /*#__PURE__*/ new class extends mg {
	_tag = "Unknown";
	getParser() {
		return K_(this, Hi);
	}
	getExpected() {
		return "unknown";
	}
}(), _g = class extends mg {
	_tag = "Literal";
	literal;
	constructor(e, t, n, r, i) {
		if (super(t, n, r, i), typeof e == "number" && !globalThis.Number.isFinite(e)) throw Error(`A numeric literal must be finite, got ${Ma(e)}`);
		this.literal = e;
	}
	getParser() {
		return G_(this, this.literal);
	}
	matchPart(e, t) {
		return e === globalThis.String(this.literal) ? this.literal : void 0;
	}
	toCodecJson() {
		return typeof this.literal == "bigint" ? vg(this) : this;
	}
	toCodecStringTree() {
		return typeof this.literal == "string" ? this : vg(this);
	}
	getExpected() {
		return typeof this.literal == "string" ? JSON.stringify(this.literal) : globalThis.String(this.literal);
	}
};
function vg(e) {
	let t = globalThis.String(e.literal);
	return v_(e, [new ug(new _g(t), new Xh(Gh(() => e.literal), Gh(() => t)))]);
}
var yg = /*#__PURE__*/ new class extends mg {
	_tag = "String";
	getParser() {
		return K_(this, Ii);
	}
	matchPart(e, t) {
		let n = this.checks;
		return n && !t.disableChecks && ev(n, e, void 0, this, t) ? void 0 : e;
	}
	getExpected() {
		return "string";
	}
}(), bg = class extends mg {
	_tag = "Number";
	getParser() {
		return K_(this, Li);
	}
	matchKey(e, t) {
		return this._match(Y_, e, t);
	}
	matchPart(e, t) {
		return this._match(J_, e, t);
	}
	_match(e, t, n) {
		if (!e.test(t)) return;
		let r = globalThis.Number(t);
		return n.disableChecks || !this.checks ? r : ev(this.checks, r, void 0, this, n) ? void 0 : r;
	}
	toCodecJson() {
		return this.checks && (xg(this.checks, "effect/schema/isFinite") || xg(this.checks, "effect/schema/isInt")) ? this : v_(this, [p_]);
	}
	toCodecStringTree() {
		return this.toCodecJson() === this ? v_(this, [Q_]) : v_(this, [$_]);
	}
	getExpected() {
		return "number";
	}
};
function xg(e, t) {
	return e.some((e) => e.annotations?.representation?.id === t || e._tag === "FilterGroup" && xg(e.checks, t));
}
var Sg = /*#__PURE__*/ new bg(), Cg = class extends mg {
	_tag = "Arrays";
	isMutable;
	elements;
	rest;
	encodingChecks;
	constructor(e, t, n, r, i, a, o, s) {
		super(r, i, a, o), this.isMutable = e, this.elements = t, this.rest = n, this.encodingChecks = s;
		let c = !1;
		for (let e = 0; e < t.length; e++) if (I_(t[e])) c = !0;
		else if (c) throw Error("A required element cannot follow an optional element. ts(1257)");
		if (c && n.length > 1) throw Error("A required element cannot follow an optional element. ts(1257)");
		for (let e = 1; e < n.length; e++) if (I_(n[e])) throw Error("An optional element cannot follow a rest element. ts(1266)");
	}
	getParser(e, t = e) {
		let n = this, r, i, a = n.elements.length, o = Math.max(0, n.rest.length - 1);
		function s(e, t) {
			return t < a ? r[t] : t >= e ? i[t - e + 1] : i[0];
		}
		let c = (e) => {
			let { input: t, len: r, options: i } = e;
			if (n.rest.length === 0 && r > a) for (let o = a; o < r; o++) {
				let r = new xh(n, t[o], i), a = new yh([o], r);
				if (i.errors === "all") e.issues ? e.issues.push(a) : e.issues = [a];
				else return X(new Sh(n, [a], t, i));
			}
			return e.issues ? X(new Sh(n, e.issues, t, i)) : lh(e.output);
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
			}, u = n.rest.length === 0 ? a : Math.max(r, a + o), d = t.concurrency === void 0 ? 1 : af(t.concurrency), f = d === 1 ? Eg(i, e, 0, u) : Dg(i, e, {
				concurrency: d,
				end: u
			});
			if (!f) return c(i);
			if (q(f)) return Im(f, () => c(i));
			let p = !0;
			return Yp(() => p ? (p = !1, Z(f, () => c(i))) : l(e, t));
		};
		return (e, a) => {
			if (e === Q) return uh;
			try {
				return Array.isArray(e) ? (r || (r = n.elements.map((e) => ({
					ast: e,
					parser: t(e)
				})), i = n.rest.map((e) => ({
					ast: e,
					parser: t(e)
				}))), l(e, a)) : X(new Ch(n, e, a));
			} catch (e) {
				return tm(e);
			}
		};
	}
	_rebuild(e, t, n) {
		let r = k_(this.elements, e), i = k_(this.rest, e);
		return r === this.elements && i === this.rest && t === this.checks && n === this.encodingChecks ? this : new Cg(this.isMutable, r, i, this.annotations, t, void 0, this.context, n);
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
function wg(e, t, n, r) {
	if (n._tag === "Failure") return Og(e, e.ast, r, n);
	let i = n === $ ? t : n[L];
	if (i !== Q) e.output[r] = i;
	else {
		let t = e.getParser(e.tailThreshold, r);
		if (I_(t.ast)) return;
		let n = new yh([r], new bh(t.ast.context?.annotations));
		if (e.options.errors === "all") e.issues ? e.issues.push(n) : e.issues = [n];
		else return Qf(new Sh(e.ast, [n], e.input, e.options));
	}
}
var Tg = {
	onItem(e, t, n) {
		let r = n < e.len ? t : Q;
		return e.getParser(e.tailThreshold, n).parser(r, e.options);
	},
	step: wg
}, Eg = /*#__PURE__*/ of()(Tg), Dg = /*#__PURE__*/ cf()(Tg), Og = (e, t, n, r) => {
	if (r.cause.reasons.length === 0) return r;
	let i = Bh(r.cause);
	if (i === void 0) return Zf(qf(r.cause, (r) => new Sh(t, [new yh([n], r)], e.input, e.options)));
	let a = new yh([n], i);
	if (e.options.errors === "all") e.issues ? e.issues.push(a) : e.issues = [a];
	else return Qf(new Sh(t, [a], e.input, e.options));
}, kg = "[+-]?\\d*\\.?\\d+(?:[Ee][+-]?\\d+)?";
function Ag(e, t, n = dg) {
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
	return a(q_(V_(t)));
}
var jg = class {
	name;
	type;
	constructor(e, t) {
		this.name = e, this.type = t;
	}
};
function Mg(e) {
	switch (e._tag) {
		case "String":
		case "Number":
		case "Symbol":
		case "TemplateLiteral": return !0;
		case "Union": return e.types.every(Mg);
		default: return !1;
	}
}
function Ng(e) {
	let t = b_(e);
	switch (t._tag) {
		case "String":
		case "Number":
		case "Symbol":
		case "TemplateLiteral": return !0;
		case "Union": return t.types.every(Ng);
		default: return !1;
	}
}
function Pg(e) {
	return Mg(e) && Ng(e);
}
var Fg = class {
	parameter;
	type;
	constructor(e, t) {
		if (!Pg(e)) throw Error(`Invalid index signature parameter ${e._tag}`);
		if (this.parameter = e, this.type = t, I_(t) && !W_(t)) throw Error("Cannot use `Schema.optionalKey` with index signatures, use `Schema.optional` instead.");
	}
}, Ig = class extends mg {
	_tag = "Objects";
	propertySignatures;
	indexSignatures;
	encodingChecks;
	constructor(e, t, n, r, i, a, o) {
		super(n, r, i, a), this.propertySignatures = e, this.indexSignatures = t, this.encodingChecks = o;
	}
	getParser(e, t = e) {
		let n = this, r = n.propertySignatures.length, i = n.indexSignatures.length;
		if (!r && !i) return K_(n, Vi);
		let a, o, s = () => (a || (a = n.propertySignatures.map((e) => ({
			parser: t(e.type),
			name: e.name,
			type: e.type
		})), o = i ? n.indexSignatures.map((n) => ({
			is: n,
			parserKey: e(q_(n.parameter)),
			parserValue: t(n.type)
		})) : void 0), a), c = () => {
			let e = new Set(n.propertySignatures.map((e) => typeof e.name == "number" ? globalThis.String(e.name) : e.name)), t = (t, i, a, o, s) => {
				if (s._tag === "Failure") return Og(t, n, i, s) ?? $f;
				let c = s === $ ? o : s[L];
				if (a !== Q && c !== Q) {
					if (r && (e.has(i) || e.has(typeof a == "number" ? globalThis.String(a) : a))) return $f;
					qa(t.out, a, c);
				}
				return $f;
			}, c = (e, r, i, a) => {
				if (!a) {
					let t = i.parserKey(r, e.options);
					if (!q(t)) return Z(om(t), (t) => c(e, r, i, t));
					a = t;
				}
				if (a._tag === "Failure") return Og(e, n, r, a) ?? $f;
				let o = a === $ ? r : a[L], s = e.input[r], l = i.parserValue(s, e.options);
				return q(l) ? t(e, r, o, s, l) : Z(om(l), (n) => t(e, r, o, s, n));
			}, l = (e, n, r) => {
				let i = e.input[n], a = r.parserValue(i, e.options);
				return q(a) ? t(e, n, n, i, a) : Z(om(a), (r) => t(e, n, n, i, r));
			}, u = i ? cf()({
				onItem: (e, [t, n]) => n.is.parameter === yg ? l(e, t, n) : c(e, t, n),
				step: (e, t, n) => n._tag === "Failure" ? n : void 0
			}) : void 0;
			return Lm(function* (t, d) {
				if (t === Q) return Q;
				if (typeof t != "object" || !t || Array.isArray(t)) return yield* X(new Ch(n, t, d));
				s();
				let f = t, p = {}, m = {
					ast: n,
					input: f,
					out: p,
					issues: void 0,
					options: d
				}, h = d.errors === "all", g = d.onExcessProperty === "error", _ = d.concurrency === void 0 ? 1 : af(d.concurrency), ee = i && g ? n.indexSignatures.map((e) => Ag(f, e.parameter, d)) : void 0;
				if (g) {
					let r = ee ? new Set(e) : e;
					if (ee) for (let e of ee) for (let t of e) r.add(t);
					let i = Reflect.ownKeys(f);
					for (let e = 0; e < i.length; e++) {
						let a = i[e];
						if (!r.has(a) && Object.prototype.propertyIsEnumerable.call(f, a)) {
							let e = new xh(n, f[a], d), r = new yh([a], e);
							if (h) {
								m.issues ? m.issues.push(r) : m.issues = [r];
								continue;
							}
							return yield* X(new Sh(n, [r], t, d));
						}
					}
				}
				if (r) {
					let e = _ === 1 ? zg(m, a) : Bg(m, a, { concurrency: _ });
					e && (yield* e);
				}
				if (i && _ === 1) for (let e = 0; e < i; e++) {
					let t = o[e], n = t.is.parameter === yg ? l : c, r = ee?.[e] ?? (t.is.parameter === yg ? Object.keys(f) : Ag(f, t.is.parameter, d));
					for (let e = 0; e < r.length; e++) {
						let i = n(m, r[e], t);
						if (!q(i)) yield* i;
						else if (i._tag === "Failure") return yield* i;
					}
				}
				else if (u) {
					let e = hc();
					for (let t = 0; t < i; t++) {
						let n = o[t], r = ee?.[t] ?? (n.is.parameter === yg ? Object.keys(f) : Ag(f, n.is.parameter, d));
						for (let t = 0; t < r.length; t++) e.push([r[t], n]);
					}
					let t = u(m, e, { concurrency: _ });
					t && (yield* t);
				}
				return m.issues ? yield* X(new Sh(n, m.issues, t, d)) : p;
			});
		};
		if (i) return c();
		let l, u = (e, t, n) => {
			let r = a[t];
			return Z(om(n), (n) => {
				let i = Lg(e, r, n);
				if (i) return i;
				let o = () => lh(e.out), s = zg(e, a.slice(t + 1));
				return s ? Im(s, o) : o();
			});
		};
		return (e, t) => {
			if (e === Q) return uh;
			if (t.errors === "all" || t.onExcessProperty !== void 0 || t.concurrency !== void 0 && af(t.concurrency) !== 1) return (l ??= c())(e, t);
			if (typeof e != "object" || !e || Array.isArray(e)) return X(new Ch(n, e, t));
			let r = s(), i = e, a = {}, o = {
				ast: n,
				input: i,
				out: a,
				issues: void 0,
				options: t
			};
			try {
				for (let e = 0; e < r.length; e++) {
					let n = r[e], s = n.name, c = Zg(i, s), l = c ? i[s] : Q, d = n.parser(l, t);
					if (!q(d)) return u(o, e, d);
					if (d === $) {
						c && qa(a, s, l);
						continue;
					}
					let f = Lg(o, n, d);
					if (f) return f;
				}
			} catch (e) {
				return tm(e);
			}
			return lh(a);
		};
	}
	_rebuild(e, t, n, r) {
		let i = k_(this.propertySignatures, (t) => {
			let n = e(t.type);
			return n === t.type ? t : new jg(t.name, n);
		}), a = k_(this.indexSignatures, (n) => {
			let r = t(n.parameter), i = e(n.type);
			return r === n.parameter && i === n.type ? n : new Fg(r, i);
		});
		return i === this.propertySignatures && a === this.indexSignatures && n === this.checks && r === this.encodingChecks ? this : new Ig(i, a, this.annotations, n, void 0, this.context, r);
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
function Lg(e, t, n) {
	if (n._tag === "Failure") return Og(e, e.ast, t.name, n);
	if (n === $) return;
	let r = n[L];
	if (r !== Q) {
		qa(e.out, t.name, r);
		return;
	}
	if (delete e.out[t.name], !I_(t.type)) {
		let n = new yh([t.name], new bh(t.type.context?.annotations));
		if (e.options.errors === "all") {
			e.issues ? e.issues.push(n) : e.issues = [n];
			return;
		}
		return Qf(new Sh(e.ast, [n], e.input, e.options));
	}
}
var Rg = {
	onItem(e, t) {
		if (!Zg(e.input, t.name)) return t.parser(Q, e.options);
		let n = e.input[t.name];
		return qa(e.out, t.name, n), t.parser(n, e.options);
	},
	step: Lg
}, zg = /*#__PURE__*/ of()(Rg), Bg = /*#__PURE__*/ cf()(Rg);
function Vg(e, t) {
	return e ? t ? [...e, ...t] : e : t;
}
function Hg(e, t, n) {
	return new Ig(Reflect.ownKeys(e).map((t) => new jg(t, e[t].ast)), [], n, t);
}
function Ug(e) {
	return e.ast;
}
function Wg(e, t, n) {
	return new $g(e.map(Ug), t, void 0, n);
}
var Gg = /*#__PURE__*/ Ai((e) => {
	for (;;) {
		if (lg(e)) return gg;
		let t = e.encoding;
		if (!t) return e.recur?.(Gg, P) ?? e;
		if (t.some((e) => e.transformation._tag === "Middleware" && e.transformation.decode !== P)) return gg;
		e = t[t.length - 1].to;
	}
});
function Kg(e) {
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
		case "Union": return Array.from(new Set(e.types.flatMap(Kg)));
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
function qg(e) {
	switch (e._tag) {
		default: return [];
		case "Declaration": {
			let t = e.annotations?.[oh];
			return Array.isArray(t) ? t : [];
		}
		case "Objects": return e.propertySignatures.flatMap((e) => {
			let t = e.type;
			if (!I_(t)) {
				if (ag(t)) return [{
					key: e.name,
					literal: t.literal
				}];
				if (og(t)) return [{
					key: e.name,
					literal: t.symbol
				}];
			}
			return [];
		});
		case "Arrays": return e.elements.flatMap((e, t) => {
			if (!I_(e)) {
				if (ag(e)) return [{
					key: t,
					literal: e.literal
				}];
				if (og(e)) return [{
					key: t,
					literal: e.symbol
				}];
			}
			return [];
		});
		case "Union": {
			if (e.types.length === 0) return [];
			let t = e.types.map((e) => qg(Gg(e)));
			return t[0].filter((e) => t.every((t) => t.some((t) => t.key === e.key && t.literal === e.literal)));
		}
		case "Suspend": return qg(e.thunk());
	}
}
var Jg = /*#__PURE__*/ new WeakMap(), Yg = /*#__PURE__*/ Object.freeze([]), Xg = (e) => e === null ? "null" : Array.isArray(e) ? "array" : typeof e, Zg = (e, t) => t === "__proto__" ? Object.hasOwn(e, t) : t in e;
function Qg(e) {
	let t = Jg.get(e);
	if (t) return t;
	let n, r = 0, i, a, o = !0, s = [];
	for (let t = 0; t < e.length; t++) {
		let c = e[t], l = Gg(c);
		if (ig(l)) continue;
		if (ag(l) || og(l)) {
			a ??= /* @__PURE__ */ new Map();
			let e = ag(l) ? l.literal : l.symbol;
			s[t] = e;
			let n = a.get(e);
			n || a.set(e, n = []), n.push(t);
		} else o = !1;
		let u = qg(l);
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
			let e = Kg(l);
			for (let n of e) (i[n] ??= []).push(t);
		}
	}
	let c = {}, l = (e) => c[e] ??= Object.freeze(i?.[e] ?? Yg);
	if (o && a) a.forEach(Object.freeze), t = (e) => a.get(e) ?? Yg;
	else if (n?.size === 1 && !i) {
		let [r, [i]] = n.entries().next().value, a = /* @__PURE__ */ new Map();
		for (let [e, t] of i) a.set(e, Object.freeze(Array.from(t)));
		let o = Object.freeze(e.map((e, t) => t));
		t = (e, t) => {
			if (Ui(e)) {
				let n = Zg(e, r) ? e[r] : void 0;
				if (n !== void 0) return a.get(n) ?? Yg;
				if (t) return o;
			}
			return Yg;
		};
	} else if (n) {
		let e;
		for (let t of n) (!e || t[1][0].size > e[1][0].size) && t[1][1].size === r && (e = t);
		t = (t, r) => {
			let a = Xg(t);
			if (!Ui(t)) return l(a);
			let o = new Set(i?.[a]), s;
			if (e) {
				let [n, [i]] = e, c = Zg(t, n), u = c ? t[n] : void 0;
				if (c && (!r || u !== void 0)) {
					let e = i.get(u);
					if (!e) return l(a);
					for (let t of e) o.add(t);
					s = n;
				}
			}
			if (s === void 0) for (let [e, [i, a]] of n) {
				let n = Zg(t, e), s = n ? t[e] : void 0;
				if (n && (!r || s !== void 0)) {
					let e = i.get(s);
					if (e) for (let t of e) o.add(t);
				} else if (r) for (let e of a) o.add(e);
			}
			for (let [e, [i, a]] of n) {
				if (e === s) continue;
				let n = Zg(t, e), c = n ? t[e] : void 0;
				if (n && (!r || c !== void 0)) {
					let e = i.get(c);
					for (let t of o) a.has(t) && !e?.has(t) && o.delete(t);
				}
			}
			return Array.from(o).sort((e, t) => e - t);
		};
	} else t = (e) => {
		let t = l(Xg(e));
		return a ? t.filter((t) => s[t] === void 0 || s[t] === e) : t;
	};
	return Jg.set(e, t), t;
}
var $g = class extends mg {
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
			if (e === Q) return uh;
			let i = (o ??= Qg(n.types))(e, r);
			if (i.length === 0) return X(new Th(n, [], e, t));
			if (i.length === 1) {
				let r = a(i[0])(e, t);
				return r._tag === "Success" ? r : q(r) ? e_(n, r.cause, e, t) : t_(n, r, e, t);
			}
			return n_(n, a, i, e, t);
		};
	}
	_rebuild(e, t, n) {
		let r = k_(this.types, e);
		return r === this.types && t === this.checks && n === this.encodingChecks ? this : new $g(r, this.options, this.annotations, t, void 0, this.context, n);
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
			let n = V_(t);
			switch (n._tag) {
				case "Arrays": {
					let t = n.elements.filter(ag);
					if (t.length > 0) return `${o_(n.isMutable)}[ ${t.map((t) => e(t) + s_(t.context?.isOptional)).join(", ")}, ... ]`;
					break;
				}
				case "Objects": {
					let t = n.propertySignatures.filter((e) => ag(e.type));
					if (t.length > 0) return `{ ${t.map((t) => `${o_(t.type.context?.isMutable)}${Pa(t.name)}${s_(t.type.context?.isOptional)}: ${e(t.type)}`).join(", ")}, ... }`;
					break;
				}
			}
			return e(n);
		});
		return Array.from(new Set(n)).join(" | ");
	}
};
function e_(e, t, n, r) {
	let i = Bh(t);
	return i ? Qf(new Th(e, [i], n, r)) : Zf(t);
}
function t_(e, t, n, r) {
	return dm(t, (t) => e_(e, t, n, r));
}
function n_(e, t, n, r, i) {
	let a = {
		ast: e,
		parser: t,
		input: r,
		out: void 0,
		successes: e.options?.mode === "oneOf" ? [] : void 0,
		issues: void 0,
		options: i
	}, o = i_(a, n);
	return o ? r_(o, a) : a.out ? a.out : X(new Th(e, a.issues ?? [], r, i));
}
function r_(e, t) {
	return Im(e, (e) => t.out === $ ? J(t.input) : t.out ? t.out : X(new Th(t.ast, t.issues ?? [], t.input, t.options)));
}
var i_ = /*#__PURE__*/ of()({
	onItem(e, t) {
		return e.parser(t)(e.input, e.options);
	},
	step(e, t, n) {
		if (n._tag === "Failure") {
			let t = Bh(n.cause);
			if (t === void 0) return n;
			e.issues ? e.issues.push(t) : e.issues = [t];
		} else {
			if (e.out && e.successes) return e.successes.push(e.ast.types[t]), Qf(new Eh(e.ast, e.successes, e.input, e.options));
			if (e.out = n, e.successes) e.successes.push(e.ast.types[t]);
			else return $f;
		}
	}
}), a_ = /*#__PURE__*/ new $g([
	/*#__PURE__*/ new _g("Infinity"),
	/*#__PURE__*/ new _g("-Infinity"),
	/*#__PURE__*/ new _g("NaN")
]);
function o_(e) {
	return e ? "" : "readonly ";
}
function s_(e) {
	return e ? "?" : "";
}
var c_ = class extends Ci {
	_tag = "Filter";
	run;
	annotations;
	aborted;
	constructor(e, t = void 0, n = !1) {
		super(), this.run = e, this.annotations = t, this.aborted = n;
	}
	annotate(e) {
		return new c_(this.run, {
			...this.annotations,
			...e
		}, this.aborted);
	}
	abort() {
		return new c_(this.run, this.annotations, !0);
	}
	and(e, t) {
		return new l_([this, e], t);
	}
}, l_ = class extends Ci {
	_tag = "FilterGroup";
	checks;
	annotations;
	constructor(e, t = void 0) {
		super(), this.checks = e, this.annotations = t;
	}
	annotate(e) {
		return new l_(this.checks, {
			...this.annotations,
			...e
		});
	}
	and(e, t) {
		return new l_([this, e], t);
	}
};
function u_(e, t, n = !1) {
	return new c_((t, n, r) => kh(n, e(t, n, r), t, r), t, n);
}
function d_(e) {
	return u_((e) => globalThis.Number.isFinite(e), {
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
var f_ = /*#__PURE__*/ C_(Sg, [/*#__PURE__*/ d_()]), p_ = /*#__PURE__*/ new ug(/*#__PURE__*/ new $g([f_, a_]), /*#__PURE__*/ new Xh(/*#__PURE__*/ qh(), /*#__PURE__*/ Gh((e) => globalThis.Number.isFinite(e) ? e : globalThis.String(e))));
function m_(e, t) {
	let n = new globalThis.RegExp(e), r = {
		source: n.source,
		flags: n.flags
	};
	return u_((e) => (n.lastIndex = 0, n.test(e)), {
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
var h_ = /*#__PURE__*/ new WeakMap();
function g_(e, t) {
	let n = Object.assign(Object.create(Object.getPrototypeOf(e)), e, t);
	return Reflect.ownKeys(t).every((e) => e === "context" || e === "encoding") && h_.set(n, __(e)), n;
}
function __(e) {
	let t = h_.get(e);
	if (t !== void 0) return t;
	if (e.encoding === void 0) return e;
	let n = Object.assign(Object.create(Object.getPrototypeOf(e)), e, { encoding: void 0 });
	return h_.set(e, n), n;
}
function v_(e, t) {
	return e.encoding === t ? e : g_(e, { encoding: t });
}
function y_(e, t) {
	if (e.context === t) return e;
	let n = __(e);
	return n.context === t && n.encoding === e.encoding ? n : g_(e, { context: t });
}
function b_(e) {
	return e.encoding ? b_(e.encoding[e.encoding.length - 1].to) : e;
}
function x_(e, t) {
	if (e.checks) {
		let n = e.checks[e.checks.length - 1];
		return S_(e, dc(e.checks.slice(0, -1), n.annotate(t)));
	}
	return g_(e, { annotations: {
		...e.annotations,
		...t
	} });
}
function S_(e, t) {
	if (e._tag === "Suspend" && t) throw Error("Cannot add checks to Suspend");
	return e.checks === t ? e : g_(e, { checks: t });
}
function C_(e, t) {
	return S_(e, Vg(e.checks, t));
}
function w_(e, t) {
	let n = t(e.to);
	return n === e.to ? e : new ug(n, e.transformation);
}
function T_(e, t) {
	let n = e, r = n[n.length - 1], i = w_(r, t);
	return i === r ? e : dc(e.slice(0, e.length - 1), i);
}
function E_(e) {
	return (t) => t.encoding ? v_(t, T_(t.encoding, e)) : t;
}
function D_(e, t) {
	function n(r) {
		if (r.encoding) {
			let e = r.encoding[r.encoding.length - 1];
			return t?.stopAt?.(e) ? r : v_(r, T_(r.encoding, n));
		}
		return e(r);
	}
	return Ai(n);
}
function O_(e, t, n) {
	let r = new ug(e, t);
	return v_(n, n.encoding ? [...n.encoding, r] : [r]);
}
function k_(e, t) {
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
function A_(e, t) {
	return y_(e, e.context ? new fg(e.context.isOptional, e.context.isMutable, e.context.constructorDefault, {
		...e.context.annotations,
		...t
	}) : new fg(!1, !1, void 0, t));
}
var j_ = /*#__PURE__*/ Ai((e) => M_(y_(e, e.context ? e.context.isOptional === !1 ? new fg(!0, e.context.isMutable, e.context.constructorDefault, e.context.annotations) : e.context : new fg(!0, !1)))), M_ = /*#__PURE__*/ E_(j_);
function N_(e, t, n) {
	return O_(e, n, t);
}
function P_(e) {
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
function F_(e, t) {
	let { literals: n, parameters: r } = P_(e);
	return new Ig(n.map((e) => new jg(e, t)), r.map((e) => new Fg(e, t)));
}
function I_(e) {
	return e.context?.isOptional ?? !1;
}
function L_(e) {
	return e.annotations?.["~structural"] === !0 || e._tag === "FilterGroup" && e.checks.every(L_);
}
function R_(e) {
	function t(e) {
		return L_(e) ? [e] : e._tag === "FilterGroup" ? e.checks.flatMap(t) : [];
	}
	let n = e.flatMap(t);
	return fc(n) ? n : void 0;
}
function z_(e) {
	let t = !0;
	function n(e) {
		return t = t && !e.encoding && !lg(e), t && "recur" in e && e.recur(n), e;
	}
	return "recur" in e && e.recur(n), t;
}
var B_ = /*#__PURE__*/ Ai((e) => {
	let t = __(e);
	if (t !== e) {
		let n = B_(t);
		return n === t && e.encoding === void 0 ? e : y_(n, e.context);
	}
	let n = "recur" in e ? e.recur(B_) : e;
	if ("encodingChecks" in n && n.encodingChecks) {
		let t = z_(e) ? n.encodingChecks : sg(n) || cg(n) || rg(n) && n.typeParameters.length > 0 ? R_(n.encodingChecks) : void 0;
		return g_(n, {
			encodingChecks: void 0,
			checks: Vg(n.checks, t)
		});
	}
	return n;
}), V_ = /*#__PURE__*/ Ai((e) => B_(U_(e)));
function H_(e, t) {
	let n = t, r = n.length, i = n[r - 1], a = [new ug(U_(v_(e, void 0)), n[0].transformation.flip())];
	for (let e = 1; e < r; e++) a.unshift(new ug(U_(n[e - 1].to), n[e].transformation.flip()));
	let o = U_(i.to);
	return o.encoding ? v_(o, [...o.encoding, ...a]) : v_(o, a);
}
var U_ = /*#__PURE__*/ ki((e) => {
	if (e.encoding) return H_(e, e.encoding);
	let t = __(e);
	if (t !== e) {
		let n = U_(t);
		return n === t ? e : y_(n, e.context);
	}
	return "flip" in e ? e.flip(U_) : "recur" in e ? e.recur(U_) : e;
});
function W_(e) {
	switch (e._tag) {
		case "Undefined": return !0;
		case "Union": return e.types.some(W_);
		default: return !1;
	}
}
function G_(e, t) {
	let n = t === 0 ? $ : lh(t);
	return (r, i) => r === Q ? uh : r === t ? n : X(new Ch(e, r, i));
}
function K_(e, t) {
	return (n, r) => n === Q ? uh : t(n) ? $ : X(new Ch(e, n, r));
}
var q_ = /*#__PURE__*/ D_((e) => {
	switch (e._tag) {
		default: return e;
		case "Number": return e.toCodecStringTree();
		case "Union": return e.recur(q_);
	}
}), J_ = /*#__PURE__*/ new globalThis.RegExp(`^${kg}$`), Y_ = /*#__PURE__*/ new globalThis.RegExp(`^(?:${kg}|Infinity|-Infinity|NaN)$`);
function X_(e) {
	return m_(J_, {
		expected: "a string representing a finite number",
		representation: {
			id: "effect/schema/isStringFinite",
			payload: null
		},
		toJsonSchema: () => ({ pattern: J_.source }),
		...e
	});
}
var Z_ = /*#__PURE__*/ C_(yg, [/*#__PURE__*/ X_()]), Q_ = /*#__PURE__*/ new ug(Z_, tg), $_ = /*#__PURE__*/ new ug(/*#__PURE__*/ new $g([Z_, a_]), tg);
function ev(e, t, n, r, i) {
	for (let a = 0; a < e.length; a++) {
		let o = e[a];
		if (o._tag === "FilterGroup") {
			if (n = ev(o.checks, t, n, r, i), n && (i.errors !== "all" || n[n.length - 1].filter.aborted)) return n;
		} else {
			let e = o.run(t, r, i);
			if (e) {
				let r = new _h(o, e, t, i);
				if (n ? n.push(r) : n = [r], i.errors !== "all" || o.aborted) return n;
			}
		}
	}
	return n;
}
function tv(e) {
	if (!rg(e)) return;
	let t = e.annotations?.[sh];
	return Bi(t) ? t(e.typeParameters) : void 0;
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/internal/schema/interpreter.js
var nv = (e, t, n) => e === $ ? n(t) : Im(e, n);
function rv(e) {
	if (e._tag === "Middleware") return (t, n, r) => iv(t === $ ? e.decode(lh(dh(n)), r) : e.decode(Fm(t, dh), r));
	let t = e.decode;
	switch (t._tag) {
		case "Passthrough": return (e, t) => e === $ ? lh(t) : e;
		case "Transform": {
			let e = (e) => e === Q ? uh : lh(t.transform(e));
			return (t, n) => nv(t, n, e);
		}
		case "TransformOptional": {
			let e = (e) => fh(t.transform(dh(e)));
			return (t, n) => nv(t, n, e);
		}
		case "TransformEffect": return (e, n, r) => nv(e, n, (e) => e === Q ? uh : t.transform(e, r));
		case "TransformOptionalEffect": return (e, n, r) => nv(e, n, (e) => iv(t.transform(dh(e), r)));
	}
}
var iv = (e) => Im(e, fh), av = (e, t, n, r) => dm(r, (r) => em(() => qf(r, (r) => new vh(e, r, t, n))));
function ov(e, t) {
	let n = rv(e.link.transformation), r;
	return (i, a) => {
		if (i === Q) return uh;
		if (e.isConstructed(i)) return $;
		let o = (r ??= t(e.link.to))(i, a);
		return n(o, i, a);
	};
}
function sv(e, t) {
	let n = e.context.constructorDefault;
	return (r, i) => {
		if (r !== Q && r !== void 0) return t(r, i);
		let a = n;
		if (q(a) && a._tag === "Success") {
			let e = t(a[L], i);
			return e === $ ? a : e;
		}
		return Im(av(e, r, i, a), (e) => {
			let n = t(e, i);
			return n === $ ? lh(e) : n;
		});
	};
}
function cv(e, t) {
	let n = t(e);
	return e.context?.constructorDefault === void 0 ? n : sv(e, n);
}
function lv(e, t, n, r, i) {
	if (e._tag === "Declaration") for (let n of e.typeParameters) t(n);
	let a = n ? tv(e) : void 0, o = a ? ov(a, t) : r ?? e.getParser(t, n), s = e.checks, c = e.encoding, l = c?.map((e) => rv(e.transformation)), u = e.encodingChecks;
	if (!c && !s && !u) return o;
	let d, f = (t, n) => {
		let r = o(t, n);
		if (u && !n.disableChecks) {
			if (q(r)) {
				if (r._tag === "Success") {
					let i = r === $ ? t : r[L];
					if (t !== Q && i !== Q) {
						let i = ev(u, t, void 0, e, n);
						i && (r = X(new Sh(e, i, t, n)));
					}
				}
			} else r = Z(r, (r) => {
				if (t !== Q && r !== Q) {
					let r = ev(u, t, void 0, e, n);
					if (r) return X(new Sh(e, r, t, n));
				}
				return J(r);
			});
		}
		if (s && !n.disableChecks) {
			if (q(r)) {
				if (r._tag === "Success") {
					let i = r === $ ? t : r[L];
					if (i === Q) return r;
					let a = ev(s, i, void 0, e, n);
					a && (r = X(new Sh(e, a, i, n)));
				}
			} else r = Z(r, (t) => {
				if (t !== Q) {
					let r = ev(s, t, void 0, e, n);
					if (r) return X(new Sh(e, r, t, n));
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
			o._tag === "Success" ? (a = o[L], o = t(a, r)) : o = Im(o, (e) => {
				let n = t(e, r);
				return n === $ ? lh(e) : n;
			});
		}
		if (o._tag === "Success") {
			let e = o[L], t = p(e, r);
			return t === $ ? o : t;
		}
		return o = av(e, n, r, o), Im(o, (e) => {
			let t = p(e, r);
			return t === $ ? lh(e) : t;
		});
	} : p;
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/internal/schema/compilerRegistry.js
var uv = /*#__PURE__*/ Symbol(), dv = /*#__PURE__*/ new WeakMap(), fv = (e) => gv(e).parser, pv = (e) => gv(e).makeEffect, mv = (e) => cv(e, pv), hv = class {
	ast;
	constructor(e) {
		this.ast = e;
	}
	get decodeEffect() {
		return this.cachedDecodeEffect ??= lv(this.ast, fv);
	}
	get parser() {
		return this.decodeEffect;
	}
	get makeEffect() {
		return this.cachedMakeEffect ??= lv(this.ast, pv, mv);
	}
};
function gv(e) {
	let t = dv.get(e);
	if (t !== void 0) return t;
	let n = new hv(e);
	return dv.set(e, n), n;
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/SchemaParser.js
function _v(e) {
	let t = e.ast, n;
	return (e, r) => (n ??= Tv(kv, B_(t)))(e, r?.disableChecks ? r?.parseOptions ? {
		...r.parseOptions,
		disableChecks: !0
	} : { disableChecks: !0 } : r?.parseOptions);
}
function vv(e) {
	let t = _v(e);
	return (e, n) => {
		let r = Mm(t(e, n));
		return ep(r) ? _s(r.value) : (Vh(r.cause, "Option adapter can only return none for schema issues"), gs());
	};
}
function yv(e) {
	return Dv(B_(e.ast));
}
function bv(e, t) {
	let n = Cv(e.ast);
	return t === void 0 ? n : (e, r) => n(e, xv(t, r));
}
var xv = (e, t) => t ? {
	...e,
	...t
} : e, Sv = (e) => e === Q ? X(new wh()) : J(e);
function Cv(e) {
	return Tv(Ov, e);
}
function wv(e, t) {
	return e === $ ? J(t) : q(e) ? e[L] === Q ? Sv(Q) : e : Im(e, Sv);
}
function Tv(e, t) {
	let n;
	return (r, i) => {
		let a = (n ??= e(t))(r, i ?? dg);
		return a === $ ? J(r) : q(a) ? a[L] === Q ? Sv(Q) : a : Im(a, Sv);
	};
}
function Ev(e, t) {
	let n = Mm(e);
	if (ep(n)) return n.value;
	let r = Vh(n.cause, t);
	throw Error("Schema validation failed", { cause: r });
}
function Dv(e) {
	let t, n;
	return (r, i) => {
		t ??= gv(e);
		let a = i?.disableChecks ? i.parseOptions ? {
			...i.parseOptions,
			disableChecks: !0
		} : { disableChecks: !0 } : i?.parseOptions ?? dg, o = t.make;
		if (o !== void 0 && r !== Q) {
			let e;
			try {
				e = o(r, a);
			} catch (e) {
				throw Vh(Kf(e), "Constructor adapter can only throw schema issues"), e;
			}
			if (e !== uv && e !== Q) return e;
		}
		return Ev(wv((n ??= t.makeEffect)(r, a), r), "Constructor adapter can only throw schema issues");
	};
}
var Ov = (e) => gv(e).parser, kv = (e) => gv(e).makeEffect, Av = "~effect/Schema/Schema", jv = /*#__PURE__*/ Symbol(), Mv = {
	[Av]: Av,
	get make() {
		let e = yv(this);
		return Object.defineProperty(this, "make", {
			value: e,
			enumerable: !0
		}), e;
	},
	get makeEffect() {
		let e = _v(this);
		return Object.defineProperty(this, "makeEffect", {
			value: e,
			enumerable: !0
		}), e;
	},
	get makeOption() {
		let e = vv(this);
		return Object.defineProperty(this, "makeOption", {
			value: e,
			enumerable: !0
		}), e;
	},
	pipe() {
		return xi(this, arguments);
	},
	annotate(e) {
		return this.rebuild(x_(this.ast, e));
	},
	annotateKey(e) {
		return this.rebuild(A_(this.ast, e));
	},
	check(...e) {
		return this.rebuild(C_(this.ast, e));
	},
	rebuild(e) {
		return Nv(e, this[jv]);
	}
};
function Nv(e, t) {
	function n() {}
	let r = Object.setPrototypeOf(n, Mv);
	return t && (Object.hasOwn(t, "name") || Object.hasOwn(t, "length") || Object.hasOwn(t, "__proto__")) ? Object.defineProperties(r, Object.getOwnPropertyDescriptors({ ...t })) : Object.assign(r, t), r[jv] = t, r.ast = e, r;
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/Struct.js
var Pv = (e) => e, Fv = "~effect/Schema/SchemaError", Iv = class extends (/*#__PURE__*/ sl("SchemaError")) {
	[Fv] = Fv;
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
		return Lh(this.issue);
	}
	toString() {
		return `SchemaError(${this.message})`;
	}
};
function Lv(e) {
	return q(e) ? Rv(e) : dm(e, (e) => em(() => qf(e, (e) => new Iv(e))));
}
function Rv(e) {
	return ep(e) ? e : Zf(qf(e.cause, (e) => new Iv(e)));
}
function zv(e, t) {
	let n = bv(e, t);
	return (e, t) => Lv(n(e, t));
}
var Bv = Nv, Vv = /*#__PURE__*/ Pv((e) => Bv(j_(e.ast), { schema: e }));
function Hv(e) {
	let t = Bv(new _g(e), {
		literal: e,
		transform(n) {
			return t.pipe(Zv(Hv(n), {
				decode: Gh(() => n),
				encode: Gh(() => e)
			}));
		}
	});
	return t;
}
var Uv = /*#__PURE__*/ Bv(yg);
function Wv(e, t) {
	return Bv(e, {
		fields: t,
		mapFields(e, t) {
			let n = e(this.fields);
			return Wv(Hg(n, t?.unsafePreserveChecks ? this.ast.checks : void 0), n);
		}
	});
}
function Gv(e) {
	return Wv(Hg(e, void 0), e);
}
function Kv(e, t) {
	return Bv(F_(e.ast, t.ast), {
		key: e,
		value: t
	});
}
var qv = /*#__PURE__*/ Pv((e) => Bv(new Cg(!1, [], [e.ast]), { value: e }));
function Jv(e, t) {
	return Bv(e, {
		members: t,
		mapMembers(e, t) {
			let n = e(this.members);
			return Jv(Wg(n, this.ast.options, t?.unsafePreserveChecks ? this.ast.checks : void 0), n);
		}
	});
}
function Yv(e, t) {
	return Jv(Wg(e, t, void 0), e);
}
function Xv(e) {
	let t = e.map(Hv);
	return Bv(Wg(t, void 0, void 0), {
		literals: e,
		members: t,
		mapMembers(e) {
			return Yv(e(this.members));
		},
		pick(e) {
			return Xv(e);
		},
		transform(e) {
			return Yv(t.map((t, n) => t.transform(e[n])));
		}
	});
}
function Zv(e, t) {
	return (n) => Bv(N_(n.ast, e.ast, t ? Qh(t) : eg()), {
		from: n,
		to: e
	});
}
var Qv = /*#__PURE__*/ Bv(f_);
globalThis.RegExp, globalThis.URL, globalThis.File, globalThis.FormData, globalThis.URLSearchParams, globalThis.Uint8Array;
var $v = Ql, ey = mf, ty = Sf, ny = "~effect/MutableRef", ry = {
	[ny]: ny,
	...ro,
	toJSON() {
		return {
			_id: "MutableRef",
			current: Ba(this.current)
		};
	}
}, iy = (e) => {
	let t = Object.create(ry);
	return t.current = e, t;
}, ay = /*#__PURE__*/ N(2, (e, t) => (e.current = t, e)), oy = /*#__PURE__*/ Symbol.for("effect/MutableList/Empty"), sy = () => ({
	head: void 0,
	tail: void 0,
	length: 0
}), cy = (e) => {
	let t = e.head;
	t.offset >= 1024 && t === e.tail && t.mutable && (t.array.length - t.offset) * 8 <= t.offset && (e.head = e.tail = {
		array: t.array.slice(t.offset),
		mutable: !0,
		offset: 0,
		next: void 0
	});
}, ly = () => ({
	array: [],
	mutable: !0,
	offset: 0,
	next: void 0
}), uy = (e, t) => {
	e.tail ? e.tail.mutable || (e.tail.next = ly(), e.tail = e.tail.next) : e.head = e.tail = ly(), e.tail.array.push(t), e.length++;
}, dy = (e, t) => {
	e.head = {
		array: [t],
		mutable: !0,
		offset: 0,
		next: e.head
	}, e.tail ||= e.head, e.length++;
}, fy = (e) => {
	e.head = e.tail = void 0, e.length = 0;
}, py = (e, t) => {
	if (t = nc(t), t <= 0 || !e.head) return [];
	if (t = Math.min(t, e.length), t === e.length && e.head?.offset === 0 && !e.head.next) {
		let t = e.head.array;
		return fy(e), t;
	}
	let n = Array(t), r = 0, i = e.head;
	for (; i;) {
		for (; i.offset < i.array.length;) if (n[r++] = i.array[i.offset], i.mutable && (i.array[i.offset] = void 0), i.offset++, r === t) return e.head = i.offset === i.array.length && i.next ? i.next : i, e.length -= t, e.length === 0 ? fy(e) : cy(e), n;
		i = i.next;
	}
	return fy(e), n;
}, my = (e) => py(e, e.length), hy = (e) => {
	if (!e.head) return oy;
	let t = e.head.array[e.head.offset];
	return e.head.mutable && (e.head.array[e.head.offset] = void 0), e.head.offset++, e.length--, e.head.offset === e.head.array.length ? e.head.next ? e.head = e.head.next : fy(e) : cy(e), t;
}, gy = (e, t) => {
	let n = [], r = e.head, i = 0;
	for (; r;) {
		for (let e = r.offset; e < r.array.length; e++) t(r.array[e], i++) && n.push(r.array[e]);
		r = r.next;
	}
	if (n.length === 0) {
		fy(e);
		return;
	}
	e.head = e.tail = {
		array: n,
		mutable: !0,
		offset: 0,
		next: void 0
	}, e.length = n.length;
}, _y = (e, t) => gy(e, (e) => e !== t), vy = "~effect/PubSub", yy = "~effect/PubSub/Subscription", by = (e) => Y(() => Iy(e.atomicPubSub(), /* @__PURE__ */ new Map(), up(), ty(!1), iy(!1), e.strategy(), iy(gs()))), xy = (e) => by({
	atomicPubSub: () => Sy(e),
	strategy: () => new Ly()
}), Sy = (e) => {
	let t = e?.replay;
	return new My(t && t > 0 ? new By(Math.ceil(t)) : void 0);
}, Cy = /*#__PURE__*/ N(2, (e, t) => e.shutdownFlag.current || ys(e.ended.current) ? !1 : e.pubsub.publish(t) ? (e.strategy.completeSubscribersUnsafe(e.pubsub, e.subscribers), !0) : !1), wy = (e) => Tm(vm((t) => {
	let n = Js(t, lp), r = mp(e.scope), i = jy(e.pubsub, e.subscribers, e.strategy, e.ended);
	return pp(r, Ty(i)).pipe(im(fp(n, (e) => hp(r, e))), cm(i));
})), Ty = (e) => Tm(nm((t) => (ay(e.shutdownFlag, !0), qp(my(e.pollers), (e) => sp(e, t.id), {
	discard: !0,
	concurrency: "unbounded"
}).pipe(am(() => Y(() => {
	e.subscribers.delete(e.subscription), e.subscription.unsubscribe(), e.replayWindow.close(), e.strategy.onPubSubEmptySpaceUnsafe(e.pubsub, e.subscribers);
})), hm(e.shutdownHook.open), lm)))), Ey = (e) => Yp(function t(n) {
	if (e.shutdownFlag.current) return Cm;
	let r = e.pollers.length === 0 ? e.subscription.pollUpTo(Infinity) : [];
	return n && (r = n.concat(r)), e.strategy.onPubSubEmptySpaceUnsafe(e.pubsub, e.subscribers), e.replayWindow.remaining > 0 ? J(e.replayWindow.takeAll().concat(r)) : fc(r) ? J(r) : Z(Dy(e), (e) => t([e]));
}), Dy = (e) => Zp((t) => {
	if (e.shutdownFlag.current) return t(Cm);
	if (ys(e.ended.current)) return t(J(e.ended.current.value));
	let n = rp(), r = e.subscribers.get(e.subscription);
	return r || (r = /* @__PURE__ */ new Set(), e.subscribers.set(e.subscription, r)), r.add(e.pollers), uy(e.pollers, n), e.strategy.completePollersUnsafe(e.pubsub, e.subscribers, e.subscription, e.pollers), n.effect ? t(n.effect) : (n.resumes = [t], Y(() => _y(e.pollers, n)));
}), Oy = /*#__PURE__*/ Symbol.for("effect/PubSub/AbsentValue"), ky = (e, t, n) => {
	e.has(t) || e.set(t, /* @__PURE__ */ new Set()), e.get(t).add(n);
}, Ay = (e, t, n) => {
	if (!e.has(t)) return;
	let r = e.get(t);
	r.delete(n), r.size === 0 && e.delete(t);
}, jy = (e, t, n, r) => new Py(e, t, e.subscribe(), sy(), ty(!1), iy(!1), n, e.replayWindow(), r), My = class {
	publisherHead = {
		value: Oy,
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
		return this.replayBuffer ? new Vy(this.replayBuffer) : Hy;
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
			this.publisherHead = this.publisherHead.next, this.publisherHead.value = Oy, this.subscribersIndex += 1, this.replayBuffer?.slide(t, e.replayIndex);
		}
	}
	subscribe() {
		return this.publisherTail.subscribers += 1, new Ny(this, this.publisherTail, this.publisherIndex, !1);
	}
}, Ny = class {
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
		for (; t;) this.subscriberHead === this.self.publisherTail ? t = !1 : this.subscriberHead.next.value === Oy ? (this.subscriberHead = this.subscriberHead.next, this.subscriberIndex += 1) : (e = !1, t = !1);
		return e;
	}
	size() {
		return this.unsubscribed ? 0 : this.self.publisherIndex - Math.max(this.subscriberIndex, this.self.subscribersIndex);
	}
	poll() {
		if (this.unsubscribed) return oy;
		let e = !0, t = oy;
		for (; e;) if (this.subscriberHead === this.self.publisherTail) e = !1;
		else {
			let n = this.subscriberHead.next.value;
			n !== Oy && (t = n, --this.subscriberHead.subscribers, this.subscriberHead.subscribers === 0 && (this.self.publisherHead = this.self.publisherHead.next, this.self.publisherHead.value = Oy, this.self.subscribersIndex += 1), e = !1), this.subscriberHead = this.subscriberHead.next, this.subscriberIndex += 1;
		}
		return t;
	}
	pollUpTo(e) {
		e = nc(e);
		let t = [], n = 0;
		for (; n !== e;) {
			let r = this.poll();
			r === oy ? n = e : (t.push(r), n += 1);
		}
		return t;
	}
	unsubscribe() {
		if (!this.unsubscribed) for (this.unsubscribed = !0, --this.self.publisherTail.subscribers; this.subscriberHead !== this.self.publisherTail;) this.subscriberHead.next.value !== Oy && (--this.subscriberHead.subscribers, this.subscriberHead.subscribers === 0 && (this.self.publisherHead = this.self.publisherHead.next, this.self.publisherHead.value = Oy, this.self.subscribersIndex += 1)), this.subscriberHead = this.subscriberHead.next;
	}
}, Py = class {
	[yy] = { _A: P };
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
}, Fy = class {
	[vy] = { _A: P };
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
}, Iy = (e, t, n, r, i, a, o) => new Fy(e, t, n, r, i, a, o), Ly = class {
	get shutdown() {
		return Xp;
	}
	handleSurplus(e, t, n, r) {
		return J(!1);
	}
	onPubSubEmptySpaceUnsafe(e, t) {}
	completePollersUnsafe(e, t, n, r) {
		return Ry(this, e, t, n, r);
	}
	completeSubscribersUnsafe(e, t) {
		return zy(this, e, t);
	}
}, Ry = (e, t, n, r, i) => {
	let a = !0;
	for (; a && !r.isEmpty();) {
		let o = hy(i);
		if (o === oy) Ay(n, r, i), i.length === 0 ? a = !1 : ky(n, r, i);
		else {
			let a = r.poll();
			a === oy ? dy(i, o) : (cp(o, Xf(a)), e.onPubSubEmptySpaceUnsafe(t, n));
		}
	}
}, zy = (e, t, n) => {
	for (let [r, i] of n) for (let a of i) e.completePollersUnsafe(t, n, r, a);
}, By = class {
	capacity;
	head = {
		value: Oy,
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
			value: Oy,
			index: 0,
			next: null
		}, this.tail = this.tail.next, this.size === this.capacity ? this.head = this.head.next : this.size += 1, t;
	}
	offerAll(e) {
		for (let t of e) this.offer(t);
	}
}, Vy = class {
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
		return this.values[this.index] = Oy, this.index = (this.index + 1) % this.values.length, this.remaining--, this.remaining === 0 && this.close(), e;
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
}, Hy = {
	remaining: 0,
	take: () => void 0,
	takeN: () => [],
	takeAll: () => [],
	close: () => void 0
}, Uy = "~effect/Queue", Wy = "~effect/Queue/Enqueue", Gy = "~effect/Queue/Dequeue", Ky = {
	_A: P,
	_E: P
}, qy = {
	[Uy]: Ky,
	[Wy]: Ky,
	[Gy]: Ky,
	...ro,
	toJSON() {
		return {
			_id: "effect/Queue",
			state: this.state._tag,
			size: ob(this)
		};
	}
}, Jy = (e) => B((t) => {
	let n = Object.create(qy);
	return n.dispatcher = t.currentDispatcher, n.capacity = e?.capacity ?? Infinity, n.strategy = e?.strategy ?? "suspend", n.messages = sy(), n.scheduleRunning = !1, n.state = {
		_tag: "Open",
		takers: /* @__PURE__ */ new Set(),
		offers: /* @__PURE__ */ new Set(),
		awaiters: /* @__PURE__ */ new Set()
	}, H(n);
}), Yy = (e) => Jy({ capacity: e }), Xy = /*#__PURE__*/ N(2, (e, t) => W(() => Zy(e, t) ? cb : e.state._tag === "Open" && e.strategy === "suspend" ? gb(e, t) : sb)), Zy = (e, t) => e.state._tag === "Open" ? e.messages.length >= e.capacity ? e.strategy === "sliding" ? (hy(e.messages), uy(e.messages, t), !0) : e.capacity <= 0 && e.state.takers.size > 0 && (uy(e.messages, t), db(e), !0) : (uy(e.messages, t), fb(e), !0) : !1, Qy = /*#__PURE__*/ N(2, (e, t) => U(() => $y(e, t))), $y = (e, t) => {
	if (e.state._tag !== "Open") return !1;
	let n = Yu(Ao(t), lb);
	return e.state.offers.size === 0 && e.messages.length === 0 ? (xb(e, n), !0) : (e.state = {
		...e.state,
		_tag: "Closing",
		exit: n
	}, fb(e), !0);
}, eb = (e) => U(() => tb(e)), tb = (e) => {
	if (e.state._tag === "Done") return !1;
	fy(e.messages);
	let t = e.state.offers;
	xb(e, e.state._tag === "Open" ? ub : e.state.exit);
	for (let e of t) vb(e);
	return !0;
}, nb = (e) => rb(e, 1, Infinity), rb = /*#__PURE__*/ N(3, (e, t, n) => (t = nc(t), n = nc(n), W(() => pb(e, t, n) ?? Fu(hb(e, () => mb(e, t)), rb(e, t, n))))), ib = (e) => W(() => ab(e) ?? Fu(hb(e, () => mb(e, 1)), ib(e))), ab = (e) => {
	if (e.state._tag === "Done") return e.state.exit;
	if (e.messages.length > 0) {
		let t = hy(e.messages);
		return bb(e), z(t);
	}
	if (e.capacity <= 0 && e.state.offers.size > 0) {
		let t = yb(e.state.offers);
		return bb(e), z(t);
	}
}, ob = (e) => e.state._tag === "Done" ? 0 : e.messages.length, sb = /*#__PURE__*/ z(!1), cb = /*#__PURE__*/ z(!0), lb = /*#__PURE__*/ jo(/*#__PURE__*/ zo()), ub = /*#__PURE__*/ Wu(), db = (e) => {
	if (e.state._tag !== "Done" && e.state.takers.size !== 0) {
		for (let t of e.state.takers) if (t.ready() && (e.state.takers.delete(t), t.resume(qu), e.messages.length === 0)) break;
	}
}, fb = (e) => {
	e.scheduleRunning || e.state._tag === "Done" || e.state.takers.size === 0 || (e.scheduleRunning = !0, e.dispatcher.scheduleTask(() => {
		e.scheduleRunning = !1, db(e);
	}, 0));
}, pb = (e, t, n) => {
	if (e.state._tag === "Done") return e.state.exit;
	if (n <= 0 || t <= 0) return z([]);
	if (!mb(e, t)) return;
	let r = e.messages.length > 0 ? py(e.messages, n) : [yb(e.state.offers)];
	return bb(e), z(r);
}, mb = (e, t) => e.messages.length >= (e.state._tag === "Closing" ? 1 : Math.min(t, e.capacity || 1)) || e.capacity <= 0 && e.state._tag !== "Done" && e.state.offers.size > 0, hb = (e, t) => fu((n) => {
	if (e.state._tag === "Done") return n(e.state.exit);
	if (t()) return n(qu);
	let r = {
		ready: t,
		resume: n
	};
	return e.state.takers.add(r), U(() => {
		e.state._tag !== "Done" && e.state.takers.delete(r);
	});
}), gb = (e, t) => fu((n) => Zy(e, t) ? n(cb) : _b(e, {
	_tag: "Single",
	message: t,
	resume: n
})), _b = (e, t) => {
	if (e.state._tag !== "Open") return vb(t);
	let n = e.state.offers;
	return n.add(t), U(() => {
		e.state._tag !== "Done" && (n.delete(t), e.state._tag === "Closing" && n.size === 0 && e.messages.length === 0 && xb(e, e.state.exit));
	});
}, vb = (e) => e._tag === "Single" ? e.resume(sb) : e.resume(z(e.remaining.slice(e.offset))), yb = (e) => {
	let t = e.values().next().value;
	if (t._tag === "Single") return e.delete(t), t.resume(cb), t.message;
	let n = t.remaining[t.offset++];
	return t.offset === t.remaining.length && (e.delete(t), t.resume(z([]))), n;
}, bb = (e) => {
	if (e.state._tag === "Done") return Bp(e.state.exit.cause);
	if (e.state.offers.size === 0) return e.state._tag === "Closing" && e.messages.length === 0 && (xb(e, e.state.exit), Bp(e.state.exit.cause));
	for (let t of e.state.offers) {
		let n = e.capacity - e.messages.length;
		if (n <= 0) break;
		if (t._tag === "Single") uy(e.messages, t.message), e.state.offers.delete(t), t.resume(cb);
		else {
			for (; t.offset < t.remaining.length; t.offset++) {
				if (n === 0) return !1;
				uy(e.messages, t.remaining[t.offset]), n--;
			}
			e.state.offers.delete(t), t.resume(z([]));
		}
	}
	return !1;
}, xb = (e, t) => {
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
}, Sb = (e) => new wb(e), Cb = (e, t, n) => fu((r) => {
	if (e.free >= t) return r(n);
	let i = () => {
		e.free < t || (e.waiters.delete(i), r(n));
	};
	return e.waiters.add(i), U(() => {
		e.waiters.delete(i);
	});
}), wb = class {
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
		let t = W(() => this.free < e ? Cb(this, e, t) : (this.taken += e, H(e)));
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
		return (t) => ef((n) => {
			let r = W(() => this.free < e ? K(n(Cb(this, e, G)), () => r) : (this.taken += e, zd(n(t), () => {
				this.releaseUnsafe(Ul(), e);
			}, !0)));
			return r;
		});
	}
	withPermit = /*#__PURE__*/ this.withPermits(1);
	withPermitsIfAvailable(e) {
		return (t) => ef((n) => this.free < e ? au : (this.taken += e, zd(n(Pu(t)), () => {
			this.releaseUnsafe(Ul(), e);
		}, !0)));
	}
}, Tb = "~effect/Channel", Eb = (e) => F(e, Tb), Db = {
	[Tb]: {
		_Env: P,
		_InErr: P,
		_InElem: P,
		_OutErr: P,
		_OutElem: P
	},
	pipe() {
		return xi(this, arguments);
	}
}, Ob = (e) => {
	let t = Object.create(Db);
	return t.transform = (t, n) => dm(e(t, n), (e) => J($p(e))), t;
}, kb = (e, t) => Ob((n, r) => Z(Mb(e)(n, r), (e) => t(e, r))), Ab = (e) => Ob((t, n) => e), jb = (e) => Ob(Nm(function* (t, n) {
	let r = mp(n), i = (e) => hp(r, Wp(e));
	return xm(yield* xm(e(t, n, r), i), i);
})), Mb = (e) => e.transform, Nb = (e, t, n) => Jy({
	capacity: n?.bufferSize,
	strategy: n?.strategy
}).pipe(am((t) => pp(e, eb(t))), am((n) => Dm(dp(t(n), e), e))), Pb = (e, t) => Ob((n, r) => sm(Nb(r, e, t), nb)), Fb = (e) => Ab(J(wm(Ey(e), () => Yf()))), Ib = (e) => Ub(sm(wy(e), Fb)), Lb = /*#__PURE__*/ N(2, (e, t) => kb(e, (e) => Y(() => {
	let n = 0;
	return sm(e, (e) => t(e, n++));
}))), Rb = (e) => e === void 0 || e !== "unbounded" && e <= 1, zb = /*#__PURE__*/ N((e) => Eb(e[0]), (e, t, n) => Rb(n?.concurrency) ? Bb(e, t) : Vb(e, t, n)), Bb = (e, t) => Ob((n, r) => {
	let i = 0;
	return sm(Mb(e)(n, r), Z((e) => t(e, i++)));
}), Vb = (e, t, n) => jb(Nm(function* (r, i, a) {
	let o = 0, s = yield* Mb(e)(r, i), c = n.concurrency === "unbounded" ? 2 ** 53 - 1 : n.concurrency, l = yield* Yy(0);
	yield* pp(a, eb(l));
	let u = Am(yield* _m()), d = ey(a);
	if (n.unordered) {
		let e = Sb(c), n = wi(e.release(1)), r = gm({
			onFailure: (e) => Z(Qy(l, e), n),
			onSuccess: (e) => Z(Xy(l, e), n)
		});
		yield* e.take(1).pipe(Z(() => s), Z((e) => {
			let n = o++;
			return d(u(r(Yp(() => t(e, n))))), Xp;
		}), Em({ disableYield: !0 }), dm((t) => e.withPermits(c - 1)(Qy(l, t))), Dm(a));
	} else {
		let e = yield* Yy(c - 2);
		yield* pp(a, eb(e)), yield* ib(e).pipe(rm, Z((e) => Xy(l, e)), Em({ disableYield: !0 }), dm((e) => Qy(l, e)), Dm(a));
		let n, r = (e) => {
			e._tag !== "Success" && (n = e.cause, $y(l, e.cause));
		};
		yield* s.pipe(Z((i) => {
			if (n) return $p(n);
			let a = o++, s = u(Yp(() => t(i, a)));
			return d(s), s.addObserver(r), Xy(e, $v(s));
		}), Em({ disableYield: !0 }), dm((t) => Xy(e, Zf(t)).pipe(im(Qy(e, t)))), Dm(a));
	}
	return ib(l);
})), Hb = (e) => kb(e, (e) => {
	let t, n = 0;
	return J(Yp(function r() {
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
}), Ub = (e) => Ob((t, n) => {
	let r;
	return J(Yp(() => r || e.pipe(dp(n), Z((e) => Mb(e)(t, n)), Z((e) => r = e))));
}), Wb = (e, t, n) => Yp(() => {
	let r = up();
	return zp(Z(Mb(e)(Yf(), r), t), n || J).pipe(Sm((e) => hp(r, e)));
}), Gb = /*#__PURE__*/ N(2, (e, t) => Wb(e, (e) => Em(Z(e, t), { disableYield: !0 }))), Kb = (e, t) => Mb(e)(Yf(), t), qb = "~effect/Stream", Jb = {
	_R: P,
	_E: P,
	_A: P
}, Yb = function(e) {
	this.channel = e;
};
Yb.prototype = {
	[qb]: Jb,
	pipe() {
		return xi(this, arguments);
	}
};
var Xb = (e) => new Yb(e), Zb = "~effect/Stream", Qb = (e) => F(e, Zb), $b = Xb, ex = (e, t) => $b(Ob((n, r) => Z(Kb(e.channel, r), (e) => t(e, r)))), tx = (e, t) => $b(Pb(e, t)), nx = (e) => $b(Ib(e)), rx = /*#__PURE__*/ N((e) => Qb(e[0]), (e, t, n) => e.channel.pipe(Hb, zb(t, n), Lb(gc), $b)), ix = /*#__PURE__*/ N((e) => Qb(e[0]), (e, t, n) => rx(e, (e) => cm(t(e), e), n)), ax = /*#__PURE__*/ N(2, (e, t) => ex(e, Nm(function* (e, n) {
	let r = yield* Np, i = Kc(Oc(t)), a, o, s = Infinity, c = ty(), l = ty(), u = ty();
	yield* e.pipe(c.whenOpen, Z((e) => (l.openUnsafe(), a = e, s = r.currentTimeMillisUnsafe() + i, Xp)), Em({ disableYield: !0 }), xm((e) => (o = e, s = r.currentTimeMillisUnsafe(), l.openUnsafe(), u.openUnsafe(), Xp)), Dm(n));
	let d = Yp(function e() {
		let t = r.currentTimeMillisUnsafe();
		return Z(mm(pm(s < t ? i : Math.min(i, s - t)), u.await), () => {
			if (r.currentTimeMillisUnsafe() < s) return e();
			if (a) {
				l.closeUnsafe(), c.closeUnsafe();
				let e = J(gc(mc(a)));
				return a = void 0, e;
			}
			return o ? $p(o) : e();
		});
	});
	return Yp(() => {
		if (o) {
			if (a) {
				let e = J(gc(mc(a)));
				return a = void 0, e;
			}
			return $p(o);
		}
		return c.openUnsafe(), l.whenOpen(d);
	});
}))), ox = /*#__PURE__*/ N(2, (e, t) => Gb(e.channel, (e) => {
	let n = 0;
	return Jp({
		while: () => n < e.length,
		body: () => t(e[n++]),
		step: Oi
	});
})), sx = Vf, cx = (e) => B((t) => e(t.getRef(sx))), lx = (...e) => cx((t) => U(() => {
	t.error(...e);
})), ux = {
	"~effect/Ref": { _A: P },
	...ro,
	toJSON() {
		return {
			_id: "Ref",
			ref: this.ref
		};
	}
}, dx = (e) => {
	let t = Object.create(ux);
	return t.ref = iy(e), t;
}, fx = (e) => Y(() => dx(e)), px = (e) => Y(() => e.ref.current), mx = /*#__PURE__*/ N(2, (e, t) => Y(() => ay(e.ref, t))), hx = "~effect/SubscriptionRef", gx = {
	...ro,
	[hx]: { _A: P },
	toJSON() {
		return {
			_id: "SubscriptionRef",
			value: this.value
		};
	}
}, _x = (e) => sm(xy({ replay: 1 }), (t) => {
	let n = Object.create(gx);
	return n.semaphore = Sb(1), n.value = e, n.pubsub = t, Cy(n.pubsub, e), n;
}), vx = (e) => nx(e.pubsub), yx = (e, t) => {
	e.value = t, Cy(e.pubsub, t);
}, bx = /*#__PURE__*/ N(2, (e, t) => e.semaphore.withPermit(Y(() => yx(e, t)))), xx = {
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
}, Sx = /^@(media|supports|container|scope|starting-style)\b/i, Cx = (e, t) => {
	let n = 0;
	for (let r = t; r < e.length; r++) {
		let t = e[r];
		if (t === "\"" || t === "'") r = wx(e, r);
		else if (t === "{" || t === "(" || t === "[") n++;
		else if ((t === "}" || t === ")" || t === "]") && --n === 0) return r + 1;
	}
	return e.length;
}, wx = (e, t) => {
	for (let n = t + 1; n < e.length; n++) if (e[n] === "\\") n++;
	else if (e[n] === e[t]) return n;
	return e.length;
}, Tx = (e, t) => {
	let n = [], r = 0, i = 0;
	for (let a = 0; a < e.length; a++) {
		let o = e[a];
		o === "\"" || o === "'" ? a = wx(e, a) : o === "(" || o === "[" || o === "{" ? r++ : o === ")" || o === "]" || o === "}" ? r-- : o === t && r === 0 && (n.push(e.slice(i, a)), i = a + 1);
	}
	return n.push(e.slice(i)), n.flatMap((e) => e.trim() ? [e.trim()] : []);
}, Ex = (e) => Tx(e, ";").flatMap((e) => {
	let t = e.indexOf(":");
	if (t <= 0) return [];
	let n = e.slice(0, t).trim(), r = e.slice(t + 1).trim(), i = /!\s*important$/i.test(r);
	return i && (r = r.replace(/\s*!\s*important$/i, "")), [{
		prop: n.startsWith("--") ? n : n.toLowerCase(),
		value: r,
		important: i
	}];
}), Dx = (e, t, n, r) => {
	let i = 0;
	for (; i < e.length;) {
		for (; i < e.length && /\s/.test(e[i]);) i++;
		if (i >= e.length) return;
		let a = i;
		for (; a < e.length && e[a] !== "{" && e[a] !== ";";) {
			let t = e[a];
			a = t === "\"" || t === "'" ? wx(e, a) + 1 : t === "(" || t === "[" ? Cx(e, a) : a + 1;
		}
		let o = e.slice(i, a).trim();
		if (a >= e.length || e[a] === ";") {
			i = a + 1;
			continue;
		}
		let s = Cx(e, a), c = e.slice(a + 1, s - 1);
		if (i = s, /^@layer\b/i.test(o)) {
			let e = o.slice(6).trim();
			Dx(c, t ? `${t}.${e}` : e, n, r);
		} else if (Sx.test(o)) Dx(c, t, [...n, o], r);
		else if (/^@property\b/i.test(o)) {
			let e = Ex(c).find((e) => e.prop === "inherits");
			r.inherits.set(o.slice(9).trim(), e?.value.trim() !== "false");
		} else if (o.startsWith("@")) continue;
		else {
			let e = c.replace(/[^;{}]*\{[^]*\}/g, "");
			r.rules.push({
				index: r.rules.length,
				layer: t,
				wrap: n,
				selector: o,
				decls: Ex(e)
			});
		}
	}
}, Ox = Pm("devtools.parseSheet")(function* (e) {
	return yield* Y(() => {
		let t = {
			rules: [],
			inherits: /* @__PURE__ */ new Map()
		};
		return Dx(e.replace(/\/\*[^]*?\*\//g, ""), "", [], t), t;
	});
}), kx = [
	0,
	0,
	0
], Ax = (e, t) => [
	e[0] + t[0],
	e[1] + t[1],
	e[2] + t[2]
], jx = (e, t) => e[0] - t[0] || e[1] - t[1] || e[2] - t[2], Mx = (e) => e.reduce((e, t) => jx(t, e) > 0 ? t : e, kx), Nx = /^-?[\w-]+/, Px = /^(is|not|has|matches)$/i, Fx = (e) => {
	let t = [
		0,
		0,
		0
	];
	for (let n = 0; n < e.length;) {
		let r = e[n], i = e.slice(n + 1);
		if (r === "#") t = Ax(t, [
			1,
			0,
			0
		]), n += 1 + (Nx.exec(i)?.[0].length ?? 0);
		else if (r === ".") t = Ax(t, [
			0,
			1,
			0
		]), n += 1 + (Nx.exec(i)?.[0].length ?? 0);
		else if (r === "[") t = Ax(t, [
			0,
			1,
			0
		]), n = Cx(e, n);
		else if (r === ":") {
			let r = e[n + 1] === ":", i = n + (r ? 2 : 1), a = Nx.exec(e.slice(i))?.[0] ?? "", o = i + a.length, s = e[o] === "(" ? e.slice(o + 1, Cx(e, o) - 1) : void 0;
			s !== void 0 && (o = Cx(e, o)), t = r ? Ax(t, [
				0,
				0,
				1
			]) : /^where$/i.test(a) ? Ax(t, kx) : Px.test(a) && s !== void 0 ? Ax(t, Mx(Tx(s, ",").map(Fx))) : Ax(t, [
				0,
				1,
				0
			]), n = o;
		} else /[a-zA-Z]/.test(r) ? (t = Ax(t, [
			0,
			0,
			1
		]), n += Nx.exec(e.slice(n))?.[0].length ?? 1) : n++;
	}
	return t;
}, Ix = /^(where|is|not|has|root|scope|host|first-child|last-child|only-child|first-of-type|last-of-type|only-of-type|empty|defined|nth-child|nth-last-child|nth-of-type|nth-last-of-type)$/i, Lx = (e, t = !1) => {
	let n = "", r = [];
	for (let i = 0; i < e.length;) {
		let a = e[i];
		if (a === "[") {
			let n = Cx(e, i);
			r.push(`${t ? "within " : ""}${e.slice(i, n)}`), i = n;
		} else if (a === ":" && e[i + 1] !== ":") {
			let a = Nx.exec(e.slice(i + 1))?.[0] ?? "", o = i + 1 + a.length, s = e[o] === "(", c = s ? Cx(e, o) : o;
			if (Ix.test(a)) {
				if (s && /^(where|is|not|has)$/i.test(a)) {
					let i = Tx(e.slice(o + 1, c - 1), ",").map((e) => Lx(e, t || /^where$/i.test(a)));
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
}, Rx = class extends Ss()("@cssints/devtools/core/page") {}, zx = (e) => xx[e] ?? [e], Bx = (e) => /^@scope\b/i.test(e), Vx = /\._[\w-]/, Hx = 1e9, Ux = /^(width|height|inline-size|block-size|min-width|min-height|max-width|max-height|flex-basis|grid-template-columns|grid-template-rows)$/, Wx = (e, t) => t === "" ? Hx : e.rank.get(t) ?? e.rank.get(t.split(".")[0]) ?? -1, Gx = (e, t, n) => {
	if (t.decl.important !== n.decl.important) return t.decl.important;
	let r = Wx(e, t.layer), i = Wx(e, n.layer);
	return ((t.decl.important ? i - r : r - i) || jx(t.specificity, n.specificity) || t.rule - n.rule) > 0;
}, Kx = Nm(function* (e, t, n) {
	let r = yield* Rx, i = e.sheet.rules.filter((e) => e.decls.length && (!n || e.decls.some((e) => e.prop === n))), a = (e) => Tx(e.selector, ",").map((e) => ({
		full: e,
		...Vx.test(e) ? Lx(e) : {
			base: e,
			states: []
		}
	})), o = i.filter((e) => e.wrap.some(Bx)), s = o.flatMap((e) => {
		let t = e.wrap.filter(Bx);
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
				specificity: n.map((e) => Fx(e.full)).reduce((e, t) => jx(t, e) > 0 ? t : e),
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
		let d = (u.length ? u : s).map((e) => Fx(e.full));
		l.push({
			rule: e,
			specificity: d.reduce((e, t) => jx(t, e) > 0 ? t : e),
			matched: u.length > 0,
			states: s.flatMap((e) => e.states)
		});
	}
	let u = [...new Set(l.flatMap((e) => e.rule.wrap.filter((e) => !Bx(e))))], d = yield* r.probe(t, u.map((e) => ({ wrap: [e] }))), f = new Map(u.map((e, t) => [e, !!d[t]]));
	return l.flatMap(({ rule: e, specificity: t, matched: r, states: i }) => {
		let a = [...e.wrap.map((e) => ({
			text: e,
			holds: Bx(e) || !!f.get(e)
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
}), qx = (e, t, n) => {
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
	} : Ux.test(e.prop) ? {
		...r,
		status: "unverified",
		reason: `${e.prop} depends on the element's content and layout, which the probe does not have`
	} : {
		...r,
		status: "mismatch",
		reason: `the browser computes ${e.computed}; ${t.selector} would give ${e.expected}`
	};
}, Jx = Nm(function* (e, t, n) {
	let r;
	for (let i of yield* Kx(e, t, n)) i.applies && (!r || Gx(e, i, r)) && (r = i);
	return r;
}), Yx = Nm(function* (e, t, n) {
	let r = yield* Rx, i = e.sheet.inherits.get(n) ?? !0, a = t;
	for (let t = 0; a && t < 64; t++) {
		let t = yield* Jx(e, a, n);
		if (t) return {
			selector: t.selector,
			layer: t.layer,
			wrap: t.wrap,
			on: yield* r.label(a)
		};
		if (!i) return;
		a = yield* r.parent(a);
	}
}), Xx = /var\(\s*(--[\w-]+)/g, Zx = Pm("devtools.inspect")(function* (e, t) {
	let n = yield* Rx, { table: r } = e, i = yield* Kx(e, t), a = i.filter((e) => e.applies), o = i.filter((e) => !e.applies), s = /* @__PURE__ */ new Map();
	for (let t of a) for (let n of zx(t.decl.prop)) {
		let r = s.get(n);
		(!r || Gx(e, t, r)) && s.set(n, t);
	}
	let c = /* @__PURE__ */ new Map();
	for (let [e, t] of s) (c.get(t) ?? c.set(t, []).get(t)).push(e);
	let l = (e, t) => zx(e.decl.prop).some((e) => t.includes(e)), u = [];
	for (let [e, i] of c) {
		let c = (yield* n.verify(t, e.decl.prop, e.selector, e.decl.value, i)).map((t) => qx(t, e, r.root));
		u.push({
			prop: e.decl.prop,
			longhands: i,
			winner: e,
			lost: zx(e.decl.prop).flatMap((t) => {
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
	for (let e of o) zx(e.decl.prop).some((e) => s.has(e)) || (d.get(e.decl.prop) ?? d.set(e.decl.prop, []).get(e.decl.prop)).push(e);
	for (let [e, t] of d) u.push({
		prop: e,
		longhands: [...zx(e)],
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
		let i = n.kind === "class" ? e.rulesOf.get(t) ?? [] : [], a = i.flatMap((e) => p.get(e) ?? []), o = i[0] === void 0 ? void 0 : e.sheet.rules[i[0]], s = o ? Tx(o.selector, ",").flatMap((e) => Lx(e).states) : [];
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
	let ee = [.../* @__PURE__ */ new Set([...i.flatMap((e) => [...e.decl.value.matchAll(Xx)].map((e) => e[1])), ...f.flatMap((e) => r.classes[e]?.tokens ?? [])])].sort(), te = yield* n.custom(t, ee), ne = [];
	for (let [n, i] of ee.entries()) {
		let a = r.tokens[i], o = yield* Yx(e, t, i);
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
}), Qx = "data-cssints-probe", $x = (e) => e.ownerNode instanceof Element && (e.ownerNode.getAttribute("data-vite-dev-id") ?? "").endsWith("virtual:cssints.css"), eS = (e, t) => sc(ac(() => e.matches(t)), () => !1), tS = (e) => {
	let t = [...e.attributes].find((e) => e.name.startsWith("data-") && e.name !== Qx);
	return `${e.localName}${e.id ? `#${e.id}` : ""}${t ? `[${t.name}${t.value ? `="${t.value}"` : ""}]` : ""}`;
}, nS = (e, t) => {
	if (!t.length) return [];
	let n = e.ownerDocument.createElement("style");
	n.textContent = t.map(({ wrap: e, selector: t }, n) => {
		let r = t ? `:is(${t}):where([${Qx}])` : `[${Qx}]`;
		return `${e.map((e) => `${e} {`).join(" ")} ${r} { --cssints-probe-${n}: 1 } ${"}".repeat(e.length)}`;
	}).join("\n"), e.ownerDocument.head.append(n), e.setAttribute(Qx, "");
	let r = getComputedStyle(e), i = t.map((e, t) => r.getPropertyValue(`--cssints-probe-${t}`).trim() === "1");
	return e.removeAttribute(Qx), n.remove(), i;
}, rS = (e, t) => {
	let n = [], r = e.ownerDocument.defaultView, i = (a, o, s) => {
		for (let c of a) if (c instanceof CSSStyleRule) {
			let r = c.style.getPropertyValue(t);
			r && eS(e, c.selectorText) && n.push({
				selector: c.selectorText,
				source: o,
				layer: s,
				value: r,
				important: c.style.getPropertyPriority(t) === "important"
			}), i(c.cssRules, o, s);
		} else c instanceof CSSLayerBlockRule ? i(c.cssRules, o, s ? `${s}.${c.name}` : c.name) : c instanceof CSSMediaRule ? r?.matchMedia(c.conditionText).matches && i(c.cssRules, o, s) : c instanceof CSSSupportsRule ? CSS.supports(c.conditionText) && i(c.cssRules, o, s) : c instanceof CSSGroupingRule && i(c.cssRules, o, s);
	};
	for (let t of e.ownerDocument.styleSheets) {
		if ($x(t)) continue;
		let e = t.ownerNode instanceof Element ? t.ownerNode : void 0, n = t.href ?? e?.getAttribute("data-vite-dev-id") ?? `<${e?.localName ?? "style"}>`, r = cc(ac(() => t.cssRules));
		r && i(r, n, "");
	}
	return n;
}, iS = (e) => cc(ac(() => {
	let t = new CSSStyleSheet();
	t.insertRule(`${e} {}`);
	let n = t.cssRules[0];
	return n instanceof CSSStyleRule ? n.selectorText : void 0;
})), aS = (e, t, n) => {
	let r = iS(t);
	if (r === void 0) return;
	let i = [], a = (e, t) => {
		for (let o of e) if (o instanceof CSSStyleRule) {
			let e = o.style.getPropertyValue(n);
			e && o.selectorText === r && i.push({
				wrap: t,
				value: e
			});
		} else o instanceof CSSMediaRule ? a(o.cssRules, [...t, `@media ${o.conditionText}`]) : o instanceof CSSSupportsRule ? a(o.cssRules, [...t, `@supports ${o.conditionText}`]) : o instanceof CSSContainerRule ? a(o.cssRules, [...t, `@container ${o.conditionText}`]) : globalThis.CSSScopeRule && o instanceof CSSScopeRule ? a(o.cssRules, [...t, `@scope${o.start ? ` (${o.start})` : ""}${o.end ? ` to (${o.end})` : ""}`]) : o instanceof CSSGroupingRule && a(o.cssRules, t);
	}, o = [...e.ownerDocument.styleSheets], s = o.filter($x);
	for (let e of s.length ? s : o) {
		let t = cc(ac(() => e.cssRules));
		t && a(t, []);
	}
	if (i.length < 2) return i[0]?.value;
	let c = nS(e, i.map(({ wrap: e }) => ({ wrap: e })));
	return i.findLast((e, t) => c[t])?.value ?? i.at(-1).value;
}, oS = /var\(\s*(--[\w-]+)/g, sS = (e, t, n, r, i) => {
	let a = e.cloneNode(!1);
	if (!(a instanceof Element) || !(a instanceof HTMLElement || a instanceof SVGElement)) return [];
	let o = t.startsWith("--") && aS(e, n, t) || r, s = getComputedStyle(e);
	for (let [, e] of o.matchAll(oS)) a.style.setProperty(e, s.getPropertyValue(e));
	a.style.setProperty(t, o, "important"), e.after(a);
	let c = getComputedStyle(a), l = e instanceof HTMLElement || e instanceof SVGElement ? e.style : void 0, u = e.getAnimations().length > 0, d = i.map((t) => {
		let n = s.getPropertyValue(t).trim(), r = c.getPropertyValue(t).trim();
		return {
			prop: t,
			computed: n,
			expected: r,
			inline: l?.getPropertyValue(t) ?? "",
			foreign: n === r ? [] : rS(e, t),
			animated: u
		};
	});
	return a.remove(), d;
}, cS = kp(Rx, Rx.of({
	classes: (e) => Y(() => [...e.classList]),
	label: (e) => Y(() => tS(e)),
	parent: (e) => Y(() => e.parentElement ?? void 0),
	matches: (e, t) => Y(() => eS(e, t)),
	probe: (e, t) => Y(() => nS(e, t)),
	custom: (e, t) => Y(() => {
		let n = getComputedStyle(e);
		return t.map((e) => n.getPropertyValue(e).trim());
	}),
	verify: (e, t, n, r, i) => Y(() => sS(e, t, n, r, i))
})), lS = 8, uS = 24, dS = 3, fS = 12, pS = 400, mS = (e, t) => t.startsWith(`${e}/`) ? t.slice(e.length + 1) : t, hS = (e, t) => e.length > t ? `${e.slice(0, t)}…` : e, gS = (e) => (e ?? "").replace(/\s+/g, " ").trim(), _S = (e) => {
	let t = e.parentElement, n = t?.parentElement;
	return [
		n?.parentElement,
		n,
		t,
		e
	].flatMap((e) => e ? [`${e.localName}${e.id ? `#${e.id}` : ""}`] : []).join(" > ");
}, vS = (e) => `${e.selector} (${e.layer || "unlayered"})`, yS = (e, t, n) => {
	let { root: r } = e, i = e.groups.flatMap((e) => e.site ? [e.site] : []), a = [
		"Change the UI of the running app as the instruction says.",
		"The styles are written with cssints: each `css.*` call below produced the classes of the element,",
		"so edit those calls (or the markup that uses them), not the generated class names.",
		"",
		`Instruction: ${n.trim()}`,
		"",
		`Element: <${e.element}>`,
		`DOM path: ${_S(t)}`,
		`Text: ${hS(gS(t.textContent), 120) || "(none)"}`,
		`Classes: ${[...t.classList].slice(0, 12).join(" ") || "(none)"}`,
		"",
		"Styled by (file:line, the call as written):"
	];
	i.length || a.push("- no cssints call: the element is styled elsewhere");
	for (let e of i.slice(0, lS)) a.push(`- ${mS(r, e.file)}:${e.line}`, `  ${hS(gS(e.text ?? ""), pS)}`);
	i.length > lS && a.push(`- … and ${i.length - lS} more`), a.push("", "Properties now (the winner, then what it beat):");
	for (let t of e.rows.slice(0, uS)) {
		if (!t.winner) continue;
		let e = t.winner, n = t.overridden.slice(0, dS).map((e) => `${e.decl.prop}: ${e.decl.value} ${vS(e)}`);
		a.push(`- ${e.decl.prop}: ${e.decl.value}${e.decl.important ? " !important" : ""} from ${vS(e)}` + (n.length ? `; overridden: ${n.join("; ")}` : ""));
	}
	if (e.rows.length > uS && a.push(`- … and ${e.rows.length - uS} more`), e.tokens.length) {
		a.push("", "Tokens it reads:");
		for (let t of e.tokens.slice(0, fS)) a.push(`- ${t.name} = ${t.computed || "(not set)"}${t.path ? ` (${t.path})` : ""}`);
	}
	return a.join("\n");
}, bS = Gv({
	file: Uv,
	line: Qv,
	column: Qv,
	classes: qv(Uv),
	text: Vv(Uv)
}), xS = Gv({
	kind: Xv([
		"class",
		"marker",
		"group"
	]),
	layer: Uv,
	wrap: qv(Uv),
	prop: Uv,
	css: Uv,
	tokens: qv(Uv),
	plugin: Vv(Uv),
	sites: qv(Qv)
}), SS = Gv({
	root: Uv,
	sheet: Uv,
	layers: qv(Uv),
	classes: Kv(Uv, xS),
	sites: qv(bS),
	tokens: Kv(Uv, Gv({
		path: Uv,
		value: Uv
	}))
}), CS = class extends sl("TableError") {}, wS = Pm("devtools.toModel")(function* (e) {
	let t = yield* zv(SS)(e).pipe(fm((e) => new CS({ message: `cssints devtools: a bad table: ${e.message}` }))), n = yield* Ox(t.sheet), r = new Map(t.layers.map((e, t) => [e, t])), i = /* @__PURE__ */ new Map();
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
}), TS = "cssints:devtools", ES = "cssints:devtools:stale", DS = "cssints:devtools:asked", OS = class extends Ss()("@cssints/devtools/core/session/Transport") {}, kS = (e, t) => tx((n) => Y(() => e.on(t, (e) => Zy(n, e)))), AS = Pm("devtools.session")(function* () {
	let e = yield* OS, t = yield* _x(void 0), n = yield* fx(!1), r = yield* fx(!0), i = mx(r, !1).pipe(im(Y(() => e.request()))), a = Qp(function* () {
		(yield* px(n)) && (yield* px(r)) && (yield* i);
	});
	return yield* Om(ox(kS(e, TS), (e) => wS(e).pipe(Z((e) => bx(t, e)), um("TableError", (e) => lx(e.message))))), yield* Om(ox(kS(e, ES).pipe(ix(() => mx(r, !0)), ax("60 millis")), () => a)), {
		model: t,
		setActive: (e) => mx(n, e).pipe(im(a))
	};
}), jS = "_1hqog5g _df4eqw _1vbyxpb _120vnyk _1t8gqy5 _1nu71z9 _14o2sa1 _1a8gflu _fjx7jy _16hpt8q _6to0fc _1lwcmvy _s7rk0y _1gqyter", MS = "_1hqog5g _120vnyj _z3zdsi _13tqlfe _1ecomh", NS = "_1f14wpf _rhyb7t _33i4pm _i1h5ry _1dh9zox _1h4s3ko _16hpt8q _6to0fc _184nt68", PS = "_1hqog5g _4k81c2 _jveril _rv7stg _ndevfi _120vnyk _r0xwy4 _1a8gflu _fjx7jy _z6zrz5 _omr8bg _6to19l _dnf785", FS = "_1s47490 _1ob5z5m _g2iyum _6axxrf _4k81c2 _1t8gqy5 _1a8gflu _1fskg2z", IS = "_1wme27f _16hpt8q _1i8j81t", LS = "_i1h7gg _1kazld4 _14o2sa1 _k0i4ku _v4t4nx _fjx7jy _n5igo9 _1lwcmvy _1gmfivd", RS = "_1t8gqy5 _1fskg2z", zS = "_1q2li77 _6to0fc _17lglqt _n5339z _1n07ta0", BS = "_1jvfuo0 _g9h8t5 _v4i8ee _m367sd _v4t4nx _1k2b3pg _16hpt8q _6to0fc _1lwcmvy _1gt2bai _hyivqx", VS = "_16hpt8q _6to0fc _g9cs3h _1jjinuh _lqk467 _1waot2e _r0xwy4 _1ajqzk5 _tnb0cg", HS = "_1jvfuo0 _g9h8t5 _1k2b3pg _16hpt8q _6to0fc", US = "_1s4813v _1cl1tpz _g2iyum _1kazkiv _16hpt8q _6to0fc", WS = "_1c7it6z", GS = "_1n07ta0", KS = "_n7bsss _oir30p _i1h5ry _k0i3ql _14o2sa1 _16hpt8q _6tnzl3", qS = "_1kazn1m _1p6y9cw", JS = "_1s47490 _138gorg _g2iyum _16hpt8q", YS = "_g9ymq9 _6to0fc", XS = "_1wme27f _6to0fc _g9cs3h", ZS = "_k9k5db _1n07ta0", QS = "_u6js88 _16hpt8q _6to0fc", $S = "_1lh9g66", eC = "_h3m4ra", tC = "_h3od5l", nC = "_u6js88 _h3m4ra _6to0fc", rC = "_1t8gqy5 _1n07ta0", iC = "_6axxrf _rv7stg _1t8gqy5 _1a8gflu _1pkekbt", aC = "_1jvfuo0 _1ywigwl _lqk467 _14o2sa1 _k0i4ku _1ajqzk5 _fjx7jy _n5igo9", oC = /* @__PURE__ */ k("<span>"), sC = /* @__PURE__ */ k("<div>except "), cC = /* @__PURE__ */ k("<div><div><span></span><!><!></div><!><!><!><!><!>"), lC = /* @__PURE__ */ k("<span>nothing applies now"), uC = /* @__PURE__ */ k("<span><!><!>"), dC = /* @__PURE__ */ k("<div><span></span> "), fC = /* @__PURE__ */ k("<div><span>: <!></span> <span>"), pC = /* @__PURE__ */ k("<div>: <!> <span></span> <!>"), mC = /* @__PURE__ */ k("<div>"), hC = /* @__PURE__ */ k("<div data-devtools=classes><h3>Classes by call"), gC = /* @__PURE__ */ k("<div data-devtools=properties><h3>Properties"), _C = /* @__PURE__ */ k("<div data-devtools=tokens><h3>Tokens"), vC = /* @__PURE__ */ k("<div><!><!>"), yC = /* @__PURE__ */ k("<div>no cssints call"), bC = /* @__PURE__ */ k("<button>:<!> ↗"), xC = /* @__PURE__ */ k("<pre data-call>"), SC = /* @__PURE__ */ k("<div>:<!>"), CC = /* @__PURE__ */ k("<div><span>.</span><span><!> <!></span><span>"), wC = /* @__PURE__ */ k("<div><div><span></span><span></span><span>"), TC = /* @__PURE__ */ k("<div>from <!> <!> <!> on <!>"), EC = /* @__PURE__ */ k("<button data-devtools=toggle title=\"cssints devtools (Alt+Shift+C)\">cssints"), DC = /* @__PURE__ */ k("<div data-devtools=ask><textarea data-devtools=ask-input rows=2 placeholder=\"Ask OpenCode to change this element (Enter sends)\">"), OC = /* @__PURE__ */ k("<aside data-devtools=panel><div><span data-devtools=element></span><button data-devtools=pick title=\"pick an element\">pick</button><button title=\"parent (↑)\">↑</button><button data-devtools=close title=\"close (Esc)\">×</button></div><!><!>"), kC = /* @__PURE__ */ k("<div><span>"), AC = /* @__PURE__ */ k("<div data-devtools=ask-status>"), jC = "@layer _.k{*{box-sizing:border-box}}@layer _.a{._n5igo9{font:inherit}._14o2sa1{border:1px solid #374151}._m367sd{border:none}._1jjinuh{margin:0 0 4px}._1nu71z9{border-radius:999px}._1t8gqy5{padding:.5rem}._99b8e4{border-color:#16a34a}._k0i3ql{border-radius:3px}._k0i4ku{border-radius:4px}._k9k5db{text-decoration:line-through}._lqk467{padding:.25rem}._v4i8ee{padding:0}._13tqlfe{outline:2px solid #60a5fa}._1fskg2z{border-bottom:1px solid #374151}._1p6y9cw{border-top:1px solid #1f2937}._1pkekbt{border-top:1px solid #374151}._z6zrz5{border-left:1px solid #374151}._184nt68{white-space:nowrap}._1kazkiv{padding-block:1px}._1kazld4{padding-block:2px}._1kazn1m{padding-block:4px}._1q2li77{margin-block:0 6px}._g2iyum{gap:.5rem}._i1h5ry{padding-inline:4px}._i1h7gg{padding-inline:6px}._r0xwy4{overflow:auto}._tnb0cg{white-space:pre}._120vnyj{z-index:2147483646}._120vnyk{z-index:2147483647}._138gorg{align-items:baseline}._16hpt8q{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}._17lglqt{text-transform:uppercase}._1a8gflu{background-color:#111827}._1ajqzk5{background-color:#0b1220}._1c7it6z{opacity:.5}._1cl1tpz{grid-template-columns:auto 1fr auto}._1dh9zox{background-color:#60a5fa}._1ecomh{background-color:#60a5fa1f}._1f14wpf{position:absolute}._1gt2bai{text-align:start}._1h4s3ko{color:#0b1220}._1hqog5g{position:fixed}._1i8j81t{font-weight:600}._1jvfuo0{display:block}._1k2b3pg{color:#60a5fa}._1lh9g66{color:#86efac}._1lwcmvy{cursor:pointer}._1n07ta0{color:#9ca3af}._1ob5z5m{align-items:center}._1s47490{display:flex}._1s4813v{display:grid}._1vbyxpb{bottom:12px}._1waot2e{max-height:120px}._1wme27f{flex-grow:1}._1ywigwl{width:100%}._33i4pm{left:0}._4k81c2{top:0}._6axxrf{position:sticky}._6tnzl3{font-size:10px}._6to0fc{font-size:11px}._6to19l{font-size:12px}._df4eqw{right:12px}._dnf785{line-height:1.45}._fjx7jy{color:#e5e7eb}._g9cs3h{overflow-wrap:anywhere}._g9h8t5{margin-bottom:2px}._g9ymq9{color:#f9a8d4}._h3m4ra{color:#fca5a5}._h3od5l{color:#fcd34d}._jveril{right:0}._n5339z{letter-spacing:.06em}._n7bsss{display:inline-block}._ndevfi{width:min(440px,100vw)}._oir30p{margin-inline-end:4px}._omr8bg{font-family:system-ui,sans-serif}._rhyb7t{top:-20px}._rv7stg{bottom:0}._s7rk0y{opacity:.75}._u6js88{padding-inline-start:12px}._v4t4nx{background-color:#0000}._z3zdsi{pointer-events:none}}@layer _.b{._1gmfivd:hover{border-color:#60a5fa}._hyivqx:hover{text-decoration:underline}._1gqyter:hover{opacity:1}}@layer _.c,_.d,_.e;\n/*$vite$:1*/", MC = "cssints-devtools", NC = (...e) => e.filter(Boolean).join(" "), PC = (e, t) => {
	let n = Mm(Zx(e, t).pipe(ym(cS)));
	return ep(n) ? n.value : String(n.cause);
}, FC = (e, t, n) => void fetch(`/__open-in-editor?file=${encodeURIComponent(`${e}:${t}:${n + 1}`)}`), IC = (e) => D(Nr, {
	get each() {
		return e.of;
	},
	children: (e) => (() => {
		var t = oC();
		return M(t, () => e.text), O(() => ({
			e: j(NC(KS, e.holds && "_99b8e4 _1lh9g66")),
			t: e.holds ? "holds now" : "does not hold now"
		}), ({ e, t: n }, r) => {
			A(t, e, r?.e), n !== r?.t && ii(t, "title", n);
		}), t;
	})()
}), LC = (e) => `${e.selector}  ${e.layer || "unlayered"}`;
function RC(e) {
	let t = () => {
		let t = e.row.verdicts;
		return t.find((e) => e.status === "mismatch") ?? t.find((e) => e.status === "unverified") ?? t[0];
	};
	var n = cC(), r = n.firstChild, i = r.firstChild, a = i.nextSibling, o = a.nextSibling, s = r.nextSibling, c = s.nextSibling, l = c.nextSibling, u = l.nextSibling, d = u.nextSibling;
	return M(i, () => e.row.prop), M(r, D(Pr, {
		get when() {
			return e.row.winner;
		},
		get fallback() {
			var e = lC();
			return O(() => j(NC(XS, GS)), (t, n) => {
				A(e, t, n);
			}), e;
		},
		children: (e) => (() => {
			var t = uC(), n = t.firstChild, r = n.nextSibling;
			return M(t, () => e().decl.value, n), M(t, () => e().decl.important ? " !important" : "", r), O(() => ({
				e: j(XS),
				t: e().selector,
				a: e().decl.value
			}), ({ e, t: n, a: r }, i) => {
				A(t, e, i?.e), n !== i?.t && ii(t, "data-winner", n), r !== i?.a && ii(t, "data-value", r);
			}), t;
		})()
	}), a), M(r, D(Pr, {
		get when() {
			return t();
		},
		children: (e) => (() => {
			var t = oC();
			return M(t, (() => {
				var t = Br(() => e().status === "ok");
				return () => t() ? "✓" : e().status === "mismatch" ? "✗" : "?";
			})()), O(() => ({
				e: j(e().status === "ok" ? $S : e().status === "mismatch" ? eC : tC),
				t: e().reason ?? `computed ${e().computed}`,
				a: e().computed
			}), ({ e, t: n, a: r }, i) => {
				A(t, e, i?.e), n !== i?.t && ii(t, "title", n), r !== i?.a && ii(t, "data-computed", r);
			}), t;
		})()
	}), o), M(n, D(Pr, {
		get when() {
			return e.row.winner;
		},
		children: (e) => (() => {
			var t = dC(), n = t.firstChild;
			return n.nextSibling, M(n, () => LC(e())), M(t, D(IC, { get of() {
				return e().conditions;
			} }), null), O(() => ({
				e: j(QS),
				t: j(GS)
			}), ({ e, t: r }, i) => {
				A(t, e, i?.e), A(n, r, i?.t);
			}), t;
		})()
	}), s), M(n, D(Pr, {
		get when() {
			return e.row.lost.length;
		},
		get children() {
			var t = sC();
			return t.firstChild, M(t, () => e.row.lost.map((e) => `${e.prop} (${e.by.selector})`).join(", "), null), O(() => j(NC(QS, GS)), (e, n) => {
				A(t, e, n);
			}), t;
		}
	}), c), M(n, D(Nr, {
		get each() {
			return e.row.overridden;
		},
		children: (e) => (() => {
			var t = fC(), n = t.firstChild, r = n.firstChild, i = r.nextSibling, a = n.nextSibling.nextSibling;
			return M(n, () => e.decl.prop, r), M(n, () => e.decl.value, i), M(a, () => LC(e)), O(() => ({
				e: j(QS),
				t: e.selector,
				a: j(ZS),
				o: j(GS)
			}), ({ e, t: r, a: i, o }, s) => {
				A(t, e, s?.e), r !== s?.t && ii(t, "data-overridden", r), A(n, i, s?.a), A(a, o, s?.o);
			}), t;
		})()
	}), l), M(n, D(Nr, {
		get each() {
			return e.row.inactive;
		},
		children: (e) => (() => {
			var t = pC(), n = t.firstChild, r = n.nextSibling, i = r.nextSibling.nextSibling, a = i.nextSibling.nextSibling;
			return M(t, () => e.decl.prop, n), M(t, () => e.decl.value, r), M(i, () => LC(e)), M(t, D(IC, { get of() {
				return e.conditions;
			} }), a), O(() => ({
				e: j(NC(QS, WS)),
				t: e.selector,
				a: j(GS)
			}), ({ e, t: n, a: r }, a) => {
				A(t, e, a?.e), n !== a?.t && ii(t, "data-inactive", n), A(i, r, a?.a);
			}), t;
		})()
	}), u), M(n, D(Nr, {
		get each() {
			return e.row.verdicts.filter((e) => e.reason);
		},
		children: (e) => (() => {
			var t = mC();
			return M(t, () => e.reason), O(() => j(e.status === "mismatch" ? nC : NC(QS, tC)), (e, n) => {
				A(t, e, n);
			}), t;
		})()
	}), d), O(() => ({
		e: j(qS),
		t: e.row.prop,
		a: t()?.status ?? "none",
		o: j(JS),
		i: j(YS)
	}), ({ e, t, a, o, i: s }, c) => {
		A(n, e, c?.e), t !== c?.t && ii(n, "data-prop", t), a !== c?.a && ii(n, "data-status", a), A(r, o, c?.o), A(i, s, c?.i);
	}), n;
}
var zC = (e, t) => e === t || JSON.stringify(e) === JSON.stringify(t);
function BC(e) {
	let t = () => e.inspection;
	return [
		(() => {
			var n = hC(), r = n.firstChild;
			return M(n, D(Nr, {
				get each() {
					return t().groups;
				},
				children: (n) => (() => {
					var r = vC(), i = r.firstChild, a = i.nextSibling;
					return M(r, D(Pr, {
						get when() {
							return n.site;
						},
						get fallback() {
							var e = yC();
							return O(() => j(GS), (t, n) => {
								A(e, t, n);
							}), e;
						},
						children: (n) => [D(Pr, {
							get when() {
								return !e.build;
							},
							get fallback() {
								var e = SC(), r = e.firstChild, i = r.nextSibling;
								return M(e, () => mS(t().root, n().file), r), M(e, () => n().line, i), O(() => ({
									e: j(HS),
									t: `${mS(t().root, n().file)}:${n().line}`
								}), ({ e: t, t: n }, r) => {
									A(e, t, r?.e), n !== r?.t && ii(e, "data-site", n);
								}), e;
							},
							get children() {
								var e = bC(), r = e.firstChild, i = r.nextSibling;
								return i.nextSibling, e._$$click = () => FC(n().file, n().line, n().column), M(e, () => mS(t().root, n().file), r), M(e, () => n().line, i), O(() => ({
									e: j(BS),
									t: `${mS(t().root, n().file)}:${n().line}`
								}), ({ e: t, t: n }, r) => {
									A(e, t, r?.e), n !== r?.t && ii(e, "data-site", n);
								}), e;
							}
						}), D(Pr, {
							get when() {
								return n().text;
							},
							get children() {
								var e = xC();
								return M(e, () => n().text), O(() => j(VS), (t, n) => {
									A(e, t, n);
								}), e;
							}
						})]
					}), i), M(r, D(Nr, {
						get each() {
							return n.classes;
						},
						children: (e) => (() => {
							var t = CC(), n = t.firstChild;
							n.firstChild;
							var r = n.nextSibling, i = r.firstChild, a = i.nextSibling, o = a.nextSibling, s = r.nextSibling;
							return M(n, () => e.cls, null), M(r, (() => {
								var t = Br(() => e.kind === "marker");
								return () => t() ? `marker of kernel ${e.plugin}` : Br(() => e.kind === "group")() ? "group marker" : Br(() => e.kind === "other")() ? "not cssints" : e.decls.map((e) => `${e.prop}: ${e.value}`).join("; ");
							})(), i), M(r, (() => {
								var t = Br(() => !!(e.kind === "class" && e.plugin));
								return () => t() ? `  (${e.plugin})` : "";
							})(), a), M(r, D(IC, { get of() {
								return e.conditions;
							} }), o), M(s, () => e.layer), O(() => ({
								e: j(NC(US, !e.active && "_1c7it6z")),
								t: e.cls,
								a: j(GS)
							}), ({ e, t: n, a: r }, i) => {
								A(t, e, i?.e), n !== i?.t && ii(t, "data-class", n), A(s, r, i?.a);
							}), t;
						})()
					}), a), r;
				})()
			}), null), O(() => ({
				e: j(RS),
				t: j(zS)
			}), ({ e, t }, i) => {
				A(n, e, i?.e), A(r, t, i?.t);
			}), n;
		})(),
		(() => {
			var e = gC(), n = e.firstChild;
			return M(e, D(Nr, {
				get each() {
					return t().rows;
				},
				children: (e) => D(RC, { row: e })
			}), null), O(() => ({
				e: j(RS),
				t: j(zS)
			}), ({ e: t, t: r }, i) => {
				A(e, t, i?.e), A(n, r, i?.t);
			}), e;
		})(),
		D(Pr, {
			get when() {
				return t().tokens.length;
			},
			get children() {
				var e = _C(), n = e.firstChild;
				return M(e, D(Nr, {
					get each() {
						return t().tokens;
					},
					children: (e) => (() => {
						var t = wC(), n = t.firstChild, r = n.firstChild, i = r.nextSibling, a = i.nextSibling;
						return M(r, () => e.name), M(i, () => e.computed || "(not set)"), M(a, () => e.path), M(t, D(Pr, {
							get when() {
								return e.source;
							},
							get fallback() {
								var t = mC();
								return M(t, () => e.registered ? "the initial value of its @property" : "not set by cssints"), O(() => j(NC(QS, GS)), (e, n) => {
									A(t, e, n);
								}), t;
							},
							children: (e) => (() => {
								var t = TC(), n = t.firstChild.nextSibling, r = n.nextSibling.nextSibling, i = r.nextSibling.nextSibling, a = i.nextSibling.nextSibling;
								return M(t, () => e().wrap.join(" "), n), M(t, () => e().selector, r), M(t, () => e().layer || "unlayered", i), M(t, () => e().on, a), O(() => j(NC(QS, GS)), (e, n) => {
									A(t, e, n);
								}), t;
							})()
						}), null), O(() => ({
							e: j(qS),
							t: e.name,
							a: j(JS),
							o: j(YS),
							i: j(XS),
							n: j(GS)
						}), ({ e, t: o, a: s, o: c, i: l, n: u }, d) => {
							A(t, e, d?.e), o !== d?.t && ii(t, "data-token", o), A(n, s, d?.a), A(r, c, d?.o), A(i, l, d?.i), A(a, u, d?.n);
						}), t;
					})()
				}), null), O(() => ({
					e: j(RS),
					t: j(zS)
				}), ({ e: t, t: r }, i) => {
					A(e, t, i?.e), A(n, r, i?.t);
				}), e;
			}
		})
	];
}
var VC = (e) => e.firstElementChild ?? void 0;
function HC(e) {
	let [t, n] = Or(!1), [r, i] = Or(!1), [a, o] = Or(), [s, c] = Or(), [l, u] = Or(0), d = () => r() ? a() ?? s() : s(), [f, p] = Or();
	jr(() => e.asked()?.status, (e) => {
		let t = f();
		e === "running" && t && (t.value = "");
	});
	let m = () => {
		let t = e.model(), n = s(), r = f()?.value.trim(), i = t && n?.isConnected ? PC(t, n) : void 0;
		r && n && typeof i == "object" && e.ask?.(yS(i, n, r));
	}, h = (r = !t()) => {
		n(r), i(r && !s()), e.setActive(r);
	}, g = Dr(() => {
		l();
		let n = e.model(), r = d();
		return t() && n && r?.isConnected ? PC(n, r) : void 0;
	}, { equals: zC }), _ = Dr(() => (l(), t() ? d()?.getBoundingClientRect() : void 0));
	return rr(() => {
		let n = (t) => t.composedPath().includes(e.host), l = (e) => {
			r() && !n(e) && e.target instanceof Element && e.target !== a() && o(e.target);
		}, d = (e) => {
			r() && !n(e) && e.target instanceof Element && (e.preventDefault(), e.stopPropagation(), c(e.target), i(!1));
		}, f = (n) => {
			if (n.altKey && n.shiftKey && n.code === "KeyC") {
				n.preventDefault(), h();
				return;
			}
			if (!t()) return;
			if (n.key === "Escape") {
				n.preventDefault(), r() && s() ? i(!1) : h(!1);
				return;
			}
			if (n.composedPath()[0] instanceof HTMLTextAreaElement) return;
			let a = s();
			if (!a || r()) return;
			let o = n.key === "ArrowUp" ? a.parentElement ?? void 0 : n.key === "ArrowDown" ? VC(a) : n.key === "ArrowLeft" ? a.previousElementSibling ?? void 0 : n.key === "ArrowRight" ? a.nextElementSibling ?? void 0 : void 0;
			o && o !== e.host && (n.preventDefault(), c(o));
		}, p = setInterval(() => t() && u((e) => e + 1), 600);
		return document.addEventListener("pointermove", l, !0), document.addEventListener("click", d, !0), window.addEventListener("keydown", f, !0), () => {
			clearInterval(p), document.removeEventListener("pointermove", l, !0), document.removeEventListener("click", d, !0), window.removeEventListener("keydown", f, !0);
		};
	}), Zn(() => e.setActive(!1)), rr(() => {
		e.build && h(!0);
	}), [
		(() => {
			var e = EC();
			return e._$$click = () => h(), O(() => j(jS), (t, n) => {
				A(e, t, n);
			}), e;
		})(),
		D(Pr, {
			get when() {
				return _();
			},
			children: (e) => (() => {
				var t = kC(), n = t.firstChild;
				return M(n, (() => {
					var e = Br(() => typeof g() == "object");
					return () => e() ? g().element : "";
				})()), O(() => ({
					e: j(MS),
					t: `${e().top}px`,
					a: `${e().left}px`,
					o: `${e().width}px`,
					i: `${e().height}px`,
					n: j(NS)
				}), ({ e, t: r, a: i, o: a, i: o, n: s }, c) => {
					A(t, e, c?.e), r !== c?.t && ai(t, "top", r), i !== c?.a && ai(t, "left", i), a !== c?.o && ai(t, "width", a), o !== c?.i && ai(t, "height", o), A(n, s, c?.n);
				}), t;
			})()
		}),
		D(Pr, {
			get when() {
				return t();
			},
			get children() {
				var t = OC(), n = t.firstChild, a = n.firstChild, o = a.nextSibling, l = o.nextSibling, u = l.nextSibling, d = n.nextSibling, f = d.nextSibling;
				return M(a, (() => {
					var e = Br(() => typeof g() == "object");
					return () => e() ? g().element : "pick an element";
				})()), o._$$click = () => i(!r()), l._$$click = () => c((e) => e?.parentElement ?? e), u._$$click = () => h(!1), M(t, D(Pr, {
					get when() {
						return e.model();
					},
					get fallback() {
						var t = mC();
						return M(t, () => e.build ? "loading the table…" : "waiting for the dev server…"), O(() => j(rC), (e, n) => {
							A(t, e, n);
						}), t;
					},
					get children() {
						return D(Pr, {
							get when() {
								return Br(() => typeof g() == "object")() ? g() : void 0;
							},
							get fallback() {
								var e = mC();
								return M(e, (() => {
									var e = Br(() => typeof g() == "string");
									return () => e() ? g() : "hover an element and click to pick it";
								})()), O(() => j(rC), (t, n) => {
									A(e, t, n);
								}), e;
							},
							children: (t) => D(BC, {
								get inspection() {
									return t();
								},
								get build() {
									return e.build;
								}
							})
						});
					}
				}), d), M(t, D(Pr, {
					get when() {
						return Br(() => !!e.ask)() ? s() : e.ask;
					},
					get children() {
						var t = DC(), n = t.firstChild;
						return n._$$keydown = (e) => {
							e.key === "Enter" && !e.shiftKey && !e.isComposing && (e.preventDefault(), m());
						}, si(() => p, n), M(t, D(Pr, {
							get when() {
								return e.asked();
							},
							children: (e) => (() => {
								var t = AC();
								return M(t, () => e().message ?? `${e().status}${e().id ? ` · ${e().id}` : ""}`), O(() => ({
									e: j(NC(QS, e().status === "completed" ? $S : e().status === "running" || e().status === "sending" ? GS : eC)),
									t: e().status,
									a: e().id
								}), ({ e, t: n, a: r }, i) => {
									A(t, e, i?.e), n !== i?.t && ii(t, "data-status", n), r !== i?.a && ii(t, "title", r);
								}), t;
							})()
						}), null), O(() => ({
							e: j(iC),
							t: j(aC)
						}), ({ e, t: r }, i) => {
							A(t, e, i?.e), A(n, r, i?.t);
						}), t;
					}
				}), f), O(() => ({
					e: j(PS),
					t: j(FS),
					a: j(IS),
					o: j(NC(LS, r() && "_1dh9zox _1h4s3ko")),
					i: r() ? "yes" : "no",
					n: j(LS),
					s: j(LS)
				}), ({ e, t: r, a: i, o: s, i: c, n: d, s: f }, p) => {
					A(t, e, p?.e), A(n, r, p?.t), A(a, i, p?.a), A(o, s, p?.o), c !== p?.i && ii(o, "data-on", c), A(l, d, p?.n), A(u, f, p?.s);
				}), t;
			}
		})
	];
}
function UC(e) {
	if (document.querySelector(MC)) return;
	let t = document.createElement(MC);
	t.setAttribute("style", "all: initial");
	let n = t.attachShadow({ mode: "open" }), r = document.createElement("style");
	r.textContent = jC;
	let i = document.createElement("div");
	n.append(r, i), document.documentElement.append(t);
	let a = jm(AS().pipe(bm(OS, e))), [o, s] = Or();
	km(ox(vx(a.model), (e) => Y(() => s(() => e))));
	let [c, l] = Or(), u = { ref: 0 }, d = e.ask && ((t) => {
		l({ status: "sending" }), u.ref += 1, e.ask?.(u.ref, t);
	});
	d && e.on(DS, (e) => {
		let t = e;
		t.ref === u.ref && l((e) => ({
			...e,
			...t
		}));
	}), qr(() => D(HC, {
		model: o,
		setActive: (e) => jm(a.setActive(e)),
		host: t,
		get build() {
			return e.build;
		},
		ask: d,
		asked: c
	}), i);
}
Yr(["click", "keydown"]);
//#endregion
export { UC as mount };
