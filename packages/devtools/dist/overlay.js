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
var ee = {}, v = Symbol("refresh"), te = /* @__PURE__ */ new Set();
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
function y(e) {
	if (An(e) && e.o?.Ln) {
		let t = rn(e).Ln = Qe(e.o?.Ln);
		if (t.Rn !== !0) return t;
		e.o !== null && (e.o.Ln = null);
	}
	return ie(e)?.we ?? e.we;
}
function ae(e, t) {
	let n = ne(t), r = e.o?.me;
	if (r) {
		let i = ne(r);
		if (te.has(i)) {
			i !== n && (!An(e) || e.C & 8388608) && (n.ii && ne(n.ii) === i ? (rn(e).me = t, e.C |= o) : i.ii && ne(i.ii) === n || re(n, i));
			return;
		}
	}
	rn(e).me = t, e.C |= o;
}
//#endregion
//#region ../../node_modules/.bun/@solidjs+signals@2.0.0-rc.13/node_modules/@solidjs/signals/dist/prod/core/scheduler.js
var oe = /* @__PURE__ */ new Set(), b = {
	eE: Array(2e3).fill(void 0),
	tE: !1,
	ln: 0,
	EE: 0
}, se = {
	eE: Array(2e3).fill(void 0),
	tE: !1,
	ln: 0,
	EE: 0
};
function ce(e) {
	if (e.oe & 128 && !le(e)) return T.Ke(e);
	e.oe & 16 ? e.oe &= -140 : (st(e, se), e.oe &= -132);
}
function le(e) {
	let t = e;
	for (; t !== null && t.oe & 32;) t = t._parent;
	return t !== null && !!(t.C & 67108864);
}
var x = 0, S = null, C = !1, ue = !1, de = !1, fe = 0, pe = !1, me = 0, he = /* @__PURE__ */ new Set();
function ge(e) {
	let t = e.m;
	return oe.size === 0 && te.size === 0 && e.ft.length === 0 && t.cn.length === 0 && t.A.length === 0 && t.ti.size === 0 && he.size === 0 && Ce.size === 0;
}
function _e() {
	if (he.size !== 0) for (let e of he) {
		if (e.u !== null) {
			he.delete(e);
			continue;
		}
		e._e === h && (e.o?.Fe === void 0 || e.o?.Fe === h) && (e.o?.t || (he.delete(e), e.C & 262144 ? fn(e) : e.o?.Hn?.()));
	}
}
function ve() {
	return {
		be: x,
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
function ye(e, t) {
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
var be = !1;
function w() {
	if (ue) {
		Oe();
		return;
	}
	C || (C = !0, !fe && !E.Jn && (be = pe, be || queueMicrotask(qe)));
}
var xe = [];
function Se() {
	for (let e of oe) xe.includes(e) || xe.push(e);
	w();
}
var Ce = /* @__PURE__ */ new Set();
function we() {
	let e = Array.from(Ce);
	Ce.clear();
	for (let t = 0; t < e.length; t++) e[t].se();
}
var Te = [], Ee = Symbol.for("solid-js/root-error-hook");
function De(e) {
	if (ue) return;
	ue = !0;
	let t = "[REACTIVITY_HALTED]", n = e !== void 0 && globalThis.reportError;
	n || e === void 0 ? console.error(t) : console.error(t, e), n && n(e);
}
function Oe() {
	de || (de = !0, console.error("[REACTIVITY_HALTED]"));
}
var ke = 0, Ae = class {
	_parent = null;
	Tt = [[], []];
	ft = [];
	ht = 0;
	created = x;
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
			this.Tt[e - 1] = [], Je(t, e);
		}
		let t = this.ft, n = ++ke;
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
		e && ($t ? ne($t).dn[e - 1].push(t) : this.Tt[e - 1].push(t)), w();
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
}, T = class e extends Ae {
	Jn = !1;
	m = ve();
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
			if (S === null && b.EE < b.ln && this.Tt[0].length === 0 && this.Tt[1].length === 0 && this.ft.length === 0 && !xe.length && !Te.length && ge(this)) {
				this.Jn = !0;
				try {
					Pn(), At(), He();
				} finally {
					this.Jn = !1;
				}
				x++, C = b.EE >= b.ln || this.Tt[0].length !== 0 || this.Tt[1].length !== 0 || this.m.Gn.length !== 0;
				return;
			}
			this.Jn = !0, Pn();
			try {
				for (; Te.length;) this.initTransition(Te.pop());
				if (At(), ut(b, e.Ke), S && e.Ei?.(S) && ut(b, e.Ke), Ce.size && (we(), ut(b, e.Ke)), S) {
					if (this.ft.length && (We(this, !0), b.EE >= b.ln && ut(b, e.Ke)), !Ze(S)) {
						let t = S;
						Ve.length = 0, ut(se, this.m === t ? ce : e.Ke), this.m === t && (Ke = this.m = ve()), te.size && (e.si(1), e.si(2)), this.stashQueues(t.dt), x++, C = b.EE >= b.ln || this.m.Gn.length > 0, Ge(t.Gn), S = null, Ue(null, !0);
						return;
					}
					let t = S, n = this.m;
					if (n !== t && n.Gn.push(...t.Gn), this.restoreQueues(t.dt), oe.delete(t), S = null, Ge(n.Gn), Ue(t), n === t) {
						let e = ve();
						e.Gn = n.Gn, e.cn = n.cn, e.A = n.A, e.ti = n.ti, Ke = this.m = e;
					}
				} else ge(this) ? (He(), b.EE >= b.ln && (ut(b, e.Ke), He())) : (oe.size && (He(), ut(se, e.Ke)), Ue());
				x++, C = b.EE >= b.ln || S !== null || this.m.Gn.length !== 0, te.size && e.si(1), this.run(1), te.size && e.si(2), this.run(2);
			} finally {
				for (; !C && !S && xe.length;) this.initTransition(xe.pop());
				this.Jn = !1;
			}
		}
	}
	notify(t, n, r, i) {
		if (n & 1) {
			if (r & 1) {
				let n = i ?? t.o?._;
				if (n?.l) return !0;
				if (n && (!S && !t.we && Ke.Gn.length && this.initTransition(), S)) {
					let r = n.source, i = S.le.get(r);
					i || S.le.set(r, i = /* @__PURE__ */ new Set());
					let a = i.size;
					i.add(t), i.size !== a && (w(), e.Nt?.(S));
				}
			}
			return !0;
		}
		return !1;
	}
	initTransition(e) {
		if (e && (e = Qe(e), e.Rn === !0 || e === S) || !e && S && S.be === x) return;
		if (!S) S = e ?? ve();
		else if (e) {
			let t = S;
			ye(e, t), this.restoreQueues(t.dt), oe.delete(t), S = e;
		}
		oe.add(S), S.be = x;
		let t = this.m;
		if (t !== S) {
			let e = this.Jn ? 0 : m;
			for (let n = 0; n < t.Gn.length; n++) {
				let r = t.Gn[n];
				if (r.we === null && r._e !== h && (!r.he || r.oe & 1024 && !(r.h & 4)) && r.xe && r.xe(r.ce, r._e)) {
					r._e = h, Re(r);
					continue;
				}
				r.we = S, r.C |= e, S.Gn.push(r);
			}
			for (let e = 0; e < t.cn.length; e++) {
				let n = t.cn[e];
				n.we = S, S.cn.push(n);
			}
			t.A.length && S.A.push(...t.A);
			for (let e of t.ti) S.ti.add(e);
			if (t.In.size) {
				for (let e of t.In) S.In.add(e);
				t.In.clear();
			}
			Ke = this.m = S;
		}
		for (let e of te) e.we ||= S;
		w();
	}
};
function je(e) {
	Ke.Gn.push(e), E.Jn || Tn();
}
var Me = !1, Ne = 0;
function Pe() {
	Ne++;
}
var Fe = 0;
function Ie(e) {
	let t = Fe;
	return Fe = e, t;
}
function Le(e, t = !1) {
	e.vn = Ne;
	let n = e.C, r = (n & 1024 ? e.o?.me : void 0) || $t, o = !!(n & 512) && e.o?.sn !== void 0, s = Me;
	for (let n = e.u; n !== null; n = n.Ae) {
		let e = n.ge;
		if (s && (e.oe &= ~i), e.oe & 4 && n.Be === e.Ye && n !== e.Nn && (e.oe |= a), o && e.C & 8) {
			e.oe |= 256;
			continue;
		}
		t && r ? (e.oe |= 128, ae(e, r)) : t && (e.oe |= 128, e.o && (e.o.me = void 0)), rt(e);
	}
}
function Re(e) {
	let t = e;
	if (!t.he) {
		e._e !== h && (e.ce = e._e, e._e = h), e.C & 256 && T.ri(e);
		return;
	}
	e._e !== h && (e.ce = e._e, e._e = h, t.h &= -5, e.je && e.je !== 3 && (e.Xe = !0), e.o && (e.o.Le = !1)), t.ve = !1, t.oe &= ~r, t.o?._ ?? Et(t), t.C &= -68157441, t.h & 1 ? e.C |= f : t.h &= -5, t.o != null && (t.o._n !== null || t.o.fn !== null) && T.en(t, !1, !0), e.C & 256 && T.ri(e);
}
var ze = null, Be = [], Ve = [];
function He() {
	for (; Ve.length;) Et(Ve.pop());
	let e = Ke.Gn;
	for (let t = 0; t < e.length; t++) {
		let n = e[t];
		Re(n), n.we = null, n.C & 131072 && (n.C &= ~l, Be.push(n));
	}
	e.length = 0, ze?.();
}
function Ue(e = null, t = !1) {
	let n = Ke, r = !t;
	r && He(), !t && E.ft.length && We(E);
	let i = e?.Dn, a = r && (e ?? n).cn.length !== 0;
	if (i && !a) for (let e of i) e.oe & 64 || rt(e);
	let o = b.EE >= b.ln;
	if (o && ut(b, T.Ke), r) {
		if (Ke !== n) {
			if (e === null || e === n) return;
		} else o && He();
		let t = e ?? n;
		if (t.cn.length && T.oi(t.cn), i && a) {
			for (let e of i) e.oe & 64 || rt(e);
			w();
		}
		if (t.In.size) {
			for (let e of t.In) e.oe & 64 || rt(e);
			t.In.clear(), w();
		}
		if (t.A.length && (T.G(t.A), E.ft.length && We(E)), t.ti.size && T._t(t.ti, e), Be.length !== 0) {
			for (; Be.length;) Le(Be.pop());
			b.EE >= b.ln && (ut(b, T.Ke), He());
		}
		_e(), te.size && T.li(e);
	}
}
function We(e, t) {
	for (let n of e.ft) t ? n.Re?.() : n.Ee?.(), We(n, t);
}
function Ge(e) {
	for (let t = 0; t < e.length; t++) e[t].we = S, e[t].C &= ~m;
}
var E = new T(), Ke = E.m;
function qe(e) {
	if (me > 0) return e ? e() : void 0;
	if (e) {
		fe++;
		try {
			return e();
		} finally {
			try {
				qe();
			} finally {
				fe--;
			}
		}
	}
	if (!E.Jn && !ue) {
		for (; C || S;) E.flush();
		Fe = 0;
	}
}
function Je(e, t) {
	for (let n = 0; n < e.length; n++) e[n](t);
}
function Ye(t, n, r) {
	let i = t.oe;
	if (i & 64) return !1;
	if (i & 32) {
		let e = t;
		for (; e && e.oe & 32;) e = e._parent;
		let n = e && (e.we || (e.C & 1048576 ? S : null));
		if (!n && e && e.C & 67108864 && e.o?.me && (n = ne(e.o.me).we), !n || (n = Qe(n)).Rn === !0 || n === r) return !1;
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
function Xe(e, t, n) {
	let r = e.le.get(t), i = !1;
	for (let e of r ?? []) {
		if (Ye(e, t, n)) return !0;
		n && e.oe & 32 ? i = !0 : r.delete(e);
	}
	return i || e.le.delete(t), !1;
}
function Ze(e) {
	if (e.Rn) return !0;
	if (e.pe.length) return !1;
	let t = !0;
	for (let n of e.le.keys()) if (Xe(e, n, e) && n.o?.ue?.size) {
		t = !1;
		break;
	}
	return t && T.ai?.(e) && (t = !1), t && (e.Rn = !0), t;
}
function Qe(e) {
	for (; e.Rn && typeof e.Rn == "object";) e = e.Rn;
	return e;
}
function $e(e) {
	for (let t of oe) if (Xe(t, e)) return t;
	return null;
}
function et(e) {
	for (let t of oe) Xe(t, e) && E.initTransition(t);
}
function tt(e, t) {
	let n = S;
	try {
		return S = Qe(e), t();
	} finally {
		S = n;
	}
}
//#endregion
//#region ../../node_modules/.bun/@solidjs+signals@2.0.0-rc.13/node_modules/@solidjs/signals/dist/prod/core/heap.js
function nt(e) {
	return e.oe & 32 ? se : b;
}
function rt(e) {
	let t = nt(e);
	t.ln > e.rn && (t.ln = e.rn), at(e, t);
}
function it(e, t) {
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
function at(e, t) {
	let n = e.oe;
	n & 1036 || (n & 1 ? e.oe = n & -4 | 10 : (e.oe = n | 8, t.tE && lt(e)), n & 16 || it(e, t));
}
function ot(e, t) {
	let n = e.oe;
	n & 1052 || (e.oe = n | 16, it(e, t));
}
function st(e, t) {
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
function ct(e) {
	if (!e.tE) {
		e.tE = !0;
		for (let t = 0; t <= e.EE; t++) for (let n = e.eE[t]; n !== void 0; n = n.Pn) n.oe & 8 && lt(n);
	}
}
function lt(e, t = 2) {
	let n = e.oe;
	if (!((n & 3) >= t)) {
		e.oe = n & -4 | t;
		for (let t = e.u; t !== null; t = t.Ae) lt(t.ge, 1);
		if (e.C & 4096) for (let t = e.o.i; t !== null; t = t.Ue) for (let e = t.u; e !== null; e = e.Ae) lt(e.ge, 1);
	}
}
function ut(e, t) {
	for (e.tE = !1, e.ln = 0; e.ln <= e.EE; e.ln++) {
		let n = e.eE[e.ln];
		for (; n !== void 0;) n.oe & 8 ? t(n) : dt(n, e), n = e.eE[e.ln];
	}
	e.EE = 0;
}
function dt(e, t) {
	st(e, t);
	let n = e.rn;
	for (let t = e.Ie; t; t = t.Ne) {
		let e = t.Oe, r = e.De || e;
		r.he && r.rn >= n && (n = r.rn + 1);
	}
	if (e.rn !== n) {
		e.rn = n;
		for (let t = e.u; t !== null; t = t.Ae) ot(t.ge, nt(t.ge));
	}
}
//#endregion
//#region ../../node_modules/.bun/@solidjs+signals@2.0.0-rc.13/node_modules/@solidjs/signals/dist/prod/core/owner.js
function ft(e) {
	let t = e.tn;
	for (; t;) {
		let e = t.oe;
		t.oe = e | 32, e & 24 && (st(t, e & 32 ? se : b), e & 8 ? at(t, se) : ot(t, se)), ft(t), t = t.un;
	}
}
function pt(e, t = !1, n) {
	let r = e.oe;
	if (r & 64) return;
	if (t && !n && e.o !== null && (e.o._n !== null || e.o.fn !== null) && pt(e, !1, !0), t) {
		e.oe = r | 64;
		let t = e;
		(t.o?.Ze || t.o?.He) && T.ri(t), t.C & 2048 && t.o.Un.forEach(T.ri);
		let n = t.we;
		n && t.h & 1 && !xe.includes(n) && (xe.push(n), w());
	}
	t && e.he && e.o !== null && (e.o.Ce = null);
	let i = n ? e.o?._n ?? null : e.tn;
	for (n || (e.tn = null); i;) {
		let e = i;
		e.C &= -33, st(e, nt(e)), Dt(e), i.gn = i, pt(i, !0), i = i.un;
	}
	if (n ? e.o !== null && (e.o._n = null) : e.En = 0, t && !n && !(r & 32) && e._parent !== null && !(e._parent.oe & 64)) {
		let t = e.gn, n = e.un;
		t === null ? e._parent.tn = n : t.un = n, n !== null && (n.gn = t), e.gn = null;
	}
	if (ht(e, n), t && e.wn) {
		let t = e.wn;
		e.wn = void 0, t();
	}
}
function mt(e, t) {
	let n = e.tn;
	t.gn = null, t.un = n, n !== null && (n.gn = t), e.tn = t;
}
function ht(e, t) {
	let n = t ? e.o?.fn : e.qe;
	if (n) {
		if (t ? e.o.fn = null : e.qe = null, Array.isArray(n)) for (let e = n.length - 1; e >= 0; e--) {
			let t = n[e];
			t.call(t);
		}
		else n.call(n);
	}
}
function gt(e, t) {
	let n = e;
	for (; n.C & 4 && n._parent;) n = n._parent;
	if (n.id != null) return yt(n.id, t ? n.En++ : n.En);
	throw Error("");
}
function _t(e) {
	return gt(e, !0);
}
function vt(e, t, n) {
	return e?.id ?? (t ? n?.id : n?.id == null ? void 0 : _t(n));
}
function yt(e, t) {
	let n = t.toString(36), r = n.length - 1;
	return e + (r ? String.fromCharCode(64 + r) : "") + n;
}
function bt() {
	return D;
}
function xt(e) {
	return D && (D.qe ? Array.isArray(D.qe) ? D.qe.push(e) : D.qe = [D.qe, e] : D.qe = e), e;
}
function St(e = !0) {
	pt(this, e);
}
function Ct(e) {
	let t = D, n = e?.transparent ?? !1, r = {
		id: vt(e, n, t),
		C: n ? 4 : 0,
		Wn: !0,
		qn: t?.Wn ? t.qn : t,
		tn: null,
		un: null,
		gn: null,
		qe: null,
		T: t?.T ?? E,
		Je: t?.Je || ee,
		En: 0,
		o: null,
		_parent: t,
		dispose: St
	};
	return t && mt(t, r), r;
}
function wt(e, t) {
	let n = Ct(t);
	return Wn(n, () => e(() => n.dispose()));
}
//#endregion
//#region ../../node_modules/.bun/@solidjs+signals@2.0.0-rc.13/node_modules/@solidjs/signals/dist/prod/core/graph.js
function Tt(e) {
	let t = e.Oe, n = e.Ne, r = e.Ae, i = e.el;
	if (r === null ? t.mn = i : r.el = i, i !== null) i.Ae = r;
	else if (t.u = r, r === null) {
		t.C & 262144 ? fn(t) : t.o?.Hn?.();
		let e = t;
		e.he && e.C & 32 && !(e.oe & 32) && !(e.h & 1) && Ot(e);
	}
	return n;
}
function Et(e) {
	let t = e.Nn, n = t === null ? e.Ie : t.Ne;
	if (n !== null) {
		do
			n = Tt(n);
		while (n !== null);
		t === null ? e.Ie = null : t.Ne = null;
	}
}
function Dt(e) {
	let t = e.Ie;
	if (t) {
		do
			t = Tt(t);
		while (t !== null);
		e.Ie = null, e.Nn = null;
	}
}
function Ot(e) {
	st(e, nt(e)), Dt(e), pt(e, !0);
}
var kt = /* @__PURE__ */ new Set();
function At() {
	if (kt.size !== 0) {
		for (let e of kt) !e.u && e.C & 32 && !(e.h & 1) && !(e.oe & 96) && Ot(e);
		kt.clear();
	}
}
function jt(e, t, n = !1) {
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
	r === null ? t.Ie = s : r.Ne = s, o === null ? e.u = s : o.Ae = s, Pe();
}
//#endregion
//#region ../../node_modules/.bun/@solidjs+signals@2.0.0-rc.13/node_modules/@solidjs/signals/dist/prod/core/async.js
function Mt(e, t) {
	return !e.o?.ue?.has(t) && ((rn(e).ue ??= /* @__PURE__ */ new Set()).add(t), !0);
}
function Nt(e, t) {
	let n = e.o?.ue;
	return n?.delete(t) ? (n.size || (e.o.ue = void 0), !0) : !1;
}
function Pt(e) {
	e.o !== null && (e.o.ue = void 0);
}
function Ft(e, t) {
	for (let n = e.Ie; n; n = n.Ne) {
		let e = n.Oe.De || n.Oe;
		if (e === t || e.o?.ue?.has(t)) return !0;
	}
	return !1;
}
function It(e, t) {
	rn(e).Pe = !0, t.source && Mt(e, t.source), e.h & 2 || Lt(e, t.source, t);
}
function Lt(t, n, r) {
	if (!n) {
		t.o !== null && (t.o._ = null);
		return;
	}
	if (r instanceof e && r.source === n) {
		rn(t)._ = r;
		return;
	}
	let i = t.o?._;
	(!(i instanceof e) || i.source !== n) && (rn(t)._ = new e(n));
}
function Rt(e, t) {
	for (let n = e.u; n !== null; n = n.Ae) t(n.ge, n);
	for (let n = e.o?.i ?? null; n !== null; n = n.Ue) for (let e = n.u; e !== null; e = e.Ae) t(e.ge, e);
}
function zt(e) {
	e.he && e.C & 32 && !e.u && !(e.oe & 32) && !(e.h & 1) && Ot(e);
}
function Bt(e) {
	let t, n = /* @__PURE__ */ new Set(), r = (e) => {
		n.has(e) || (n.add(e), !e.u && e.C & 32 && (t ??= []).push(e), Rt(e, r));
	};
	if (Rt(e, r), t) for (let e of t) zt(e);
}
function Vt(e, t) {
	let n = !1, r = /* @__PURE__ */ new Set(), i = (e) => {
		r.has(e) || (r.add(e), e.o?._ === t && (rt(e), n = !0), Rt(e, i));
	};
	Rt(e, i), n && w();
}
function Ht(e, t = e) {
	Nt(e, t);
	let n = !1, r, i = /* @__PURE__ */ new Set(), a = T.Ge, o = (s) => {
		if (i.has(s) || t !== e && Ft(s, t) || !Nt(s, t)) return;
		i.add(s), s.be = x;
		let c = s.o?.ue?.values().next().value, l = s.h & 2;
		c ? (l || Lt(s, c), a?.(s)) : (s.h &= -2, l || Lt(s), a?.(s), s.o?.Pe && (rt(s), n = !0), s.o !== null && (s.o.Pe = !1), !s.u && s.C & 32 && (r ??= []).push(s)), Rt(s, o);
	};
	if (Rt(e, o), r) for (let e of r) zt(e);
	n && w();
}
function Ut(e) {
	return typeof e == "object" && !!e && typeof e.then == "function";
}
function Wt(e) {
	let t = e.o?.ye;
	t != null && (e.o.ye = null, t());
}
function Gt(t, n, r) {
	let i = !1, a = !1;
	if (typeof n == "object" && n && hn(() => {
		i = n[Symbol.asyncIterator], a = !i && Ut(n);
	}), !a && !i) return t.o !== null && (t.o.Ce = null), t.ve = !1, n;
	rn(t).Ce = n, t.o.ue = void 0;
	let o = Fe, s, c = () => {
		let e = y(t);
		if (t.o?.me && (e = $e(t) ?? e), e && t.h & 4 && !Qe(e).le.has(t)) {
			t.we = null;
			return;
		}
		E.initTransition(e), et(t);
	}, l = (r) => {
		if (t.o?.Ce !== n) return;
		let i = r instanceof e;
		if (i && t.ve) {
			t.o !== null && (t.o.Ce = null), It(t, r), t.be = x;
			return;
		}
		c(), Jt(t, i ? 1 : 2, r), i && Ht(t), t.be = x, i || Bt(t);
	}, u = (e, i) => {
		if (t.o?.Ce !== n || t.oe & 130) return;
		Ie(o), c();
		let a = !!(t.h & 4), s = t.o?.Le;
		qt(t), s && (t.o.Le = !0);
		let u = ie(t);
		if (u && u.Qe.delete(t), r) {
			try {
				r(e);
			} catch (e) {
				l(e);
				return;
			}
			a && qt(t, !0);
		} else if (t.o?.Fe !== void 0 && !(u && t.C & 8388608)) t._e === h && je(t), t._e = e, T.Ve?.(t, e), An(t) ? T.ke(t, e) : Le(t), t.be = x;
		else if (u) {
			let n = t.je, r = An(t) ? _(t.o.Fe) : t.ce, i = t.xe;
			try {
				(!n && a || !i || !i(r, e)) && (n ? t.ce = e : T.Me(t, e, u), t.be = x, T.Ve?.(t, e), Le(t, !0));
			} catch (e) {
				Jt(t, 2, e);
			}
		} else try {
			zn(t, () => e);
		} catch (e) {
			Jt(t, 2, e);
		}
		t._e === h && (t.ve = !1, s && (t.o.Le = !1), Et(t)), Ht(t), w(), qe(), i?.();
	}, d = () => t.C & 32 && !t.u && !(t.h & 1) ? (Ot(t), !0) : !1, f = (e, r) => {
		let i = e[Symbol.asyncIterator](), a = !1, o = !1, c = !r, f = () => {
			if (!o) {
				o = !0;
				try {
					let e = i.return?.();
					Ut(e) && e.then(void 0, () => {});
				} catch {}
			}
		};
		r ? r(f) : xt(f), rn(t).ye = f;
		let p = () => {
			d() || m();
		}, m = () => {
			let e, r, f = !1, h = !1, g = !0, _ = i.next();
			if ((Ut(_) ? _ : { then: (e) => void e(_) }).then((r) => {
				if (g && c) e = r, f = !0, r.done && (o = !0);
				else if (t.o?.Ce !== n) return;
				else r.done ? (o = !0, a ? (w(), qe()) : u(void 0), d()) : (a = !0, u(r.value, p));
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
			throw E.initTransition(y(t)), new e(D);
		}
	}
	if (i && m(n), p !== null) {
		if (!p) {
			if (t.ve) return t.ce;
			throw E.initTransition(y(t)), new e(D);
		}
		t.ve = !1;
	}
	return s;
}
function Kt(e, t = !1) {
	e.o?.ue && Pt(e), e.o?.Pe && e.o !== null && (e.o.Pe = !1), e.o !== null && (e.o.Le = !1), e.h = t ? 0 : e.h & 4, e.o?._ && Lt(e), (e.o?.Ze || e.o?.He) && T.Ge(e), e.o?.i && e.C & 2048 && T.We !== null && T.We(e);
	let n = cn(e);
	n && n.call(e);
}
function qt(e, t = !1) {
	let n = e.o?.ue;
	n && (n.delete(e), n.size) ? (e.o.Pe = !1, t && (e.h = 1), Lt(e, n.values().next().value)) : Kt(e, t);
}
function Jt(n, r, i, a, o) {
	r === 2 && !(i instanceof t) && !(i instanceof e) && (i = new t(n, i));
	let s = r === 1 && i instanceof e ? i.source : void 0, c = s === n, l = r === 1 && n.o?.Fe !== void 0 && !(n.C & 8388608) && !c, u = l && An(n);
	a || (o && ae(n, o), r === 1 && s ? (Mt(n, s), n.h & 1 || (n.C &= ~f), n.h = 1 | n.h & 4, Lt(n, s, i)) : (Pt(n), n.h = r | (r === 2 ? 0 : n.h & 4), rn(n)._ = i), T.Ge?.(n), n.o?.i && n.C & 2048 && T.We !== null && T.We(n));
	let d = a || u, p = a || l ? void 0 : o, m = cn(n);
	if (m) {
		if (a && r === 1) return;
		d ? m.call(n, r, i) : m.call(n);
		return;
	}
	Rt(n, (t, n) => {
		if (t.be = x, r === 1 && n.Be !== t.Ye) {
			rt(t), w();
			return;
		}
		if (r === 1 && s && !t.o?.ue?.has(s) || r !== 1 && (t.o?._ !== i || t.o?.ue)) {
			if (n.ze && r !== 1 && !(i instanceof e)) {
				rt(t), w();
				return;
			}
			d || (t.we ? s && !t.je && (t.h & 1 || t._e !== h) && E.initTransition(t.we) : je(t)), Jt(t, r, i, d, p);
		}
	});
}
T.Ke = (e) => {
	e.je === 3 ? (st(e, nt(e)), e.Xe = !0, e.T.enqueue(2, e.$e)) : en(e);
}, T.en = pt;
var Yt = !1, Xt = !1, Zt = !1, Qt = !1, D = null, $t = null;
function en(t, n = !1) {
	Pe();
	let r = t.je, o = !!(t.oe & 128), s = null;
	if (o ? (s = T.an(t, !0), s === !1 && (o = !1)) : t.C & 8388608 ? (s = T.an(t, !0), s && (o = !0)) : S && !n && S.cn.length && (s = T.an(t, !1), s && (o = !0)), !n) {
		if (t.we && !r && S !== t.we && E.initTransition(t.we), st(t, nt(t)), t.o !== null && (t.o.Ce = null, Wt(t)), r === 3 || t.C & 68157440) pt(t);
		else if (t.tn !== null || t.qe !== null) {
			ft(t);
			let e = rn(t);
			e.fn = t.qe, e._n = t.tn, t.qe = null, t.tn = null, t.En = 0, s && (t.C |= d, ne(s).dn[0].push(() => {
				t.C &= ~d, pt(t, !1, !0);
			}));
		}
	}
	let c = !!(t.C & 8388736) && t.o?.Fe !== h && t.o?.Fe !== void 0, l = !!(t.h & 4), f = t.h & 2 ? t.o?._ : void 0, p = !!(t.h & 1), m = p ? t.o?.ue : void 0, g = t.o?.ue?.has(t), ee = (t.oe & i) !== 0, v = t.ve, te = bn;
	bn = null;
	let re = D;
	D = t, t.Nn = null, t.Ye++, t.oe = 4 | t.oe & 32, t.be = x;
	let ie = t._e === h ? t.ce : t._e, y = t.rn, ae = !1, oe = Yt, b = $t;
	Yt = !0;
	let se = Qt;
	Qt = !1, r || ($t = null), s && ($t = s);
	let ce = r && r !== 2, le = Xt;
	ce && (Xt = !0), r && S !== null && S.In.size && S.In.delete(t);
	try {
		if (t.C & 64) ie = t.he(ie), t.o !== null && (t.o.Ce = null), t.ve = !1;
		else {
			let e = t.o?.Ce, n = t.he(ie), r = typeof n == "object" && !!n, i = t.o?.Ce !== e;
			ie = i || !r ? n : Gt(t, n), !i && !r && (t.o !== null && (t.o.Ce = null), t.ve = !1);
		}
		(t.h !== 0 || t.o !== null) && Kt(t, n && bn === null), t.C & 1024 && t.o?.me && T.Tn(t);
	} catch (n) {
		let r = n instanceof e;
		if (r && t.ve) It(t, n);
		else {
			r && $t && T.Sn(t);
			let e = !1;
			if (r && (rn(t).Pe = !0, T.On !== null && (e = T.On(t, ee))), Jt(t, r ? 1 : 2, n, void 0, r ? t.o?.me : void 0), r && g && !t.o?.Ce && Ht(t), r && m) for (let e of m) e !== t && !t.o?.ue?.has(e) && Ht(t, e);
			e && T.k(t);
		}
	} finally {
		Yt = oe, Qt = se, ce && (Xt = le), ae = (t.oe & a) !== 0, t.oe = t.oe & 96 | (n ? t.oe & 256 : 0), D = re;
	}
	let C = bn;
	if (bn = te, t.oe & 64) {
		Dt(t), t.o !== null && (t.o.Ce = null), $t = b;
		return;
	}
	if (!t.o?._) {
		let i = c ? _(t.o?.Fe) : o || t._e === h ? t.ce : t._e, a = !1;
		try {
			a = !r && l || !t.xe || !t.xe(i, ie);
		} catch (e) {
			Jt(t, 2, e);
		}
		if (r && a && (t.Xe = !t.o?._, !n)) {
			t.T.enqueue(r, t.An ??= T.Cn.bind(null, t));
			let e = t.pn;
			e !== S && (t.pn = S, e !== null && (e = Qe(e)) !== S && !e.Rn && ((e.Dn ??= []).push(t), S !== null && (S.Dn ??= []).push(t)));
		}
		if (!t.o?._) {
			if (a) {
				let i = c ? t.o?.Fe : void 0;
				n && C === null || r && C === null && (S !== t.we || S === null || t.C & 32768) || o ? (o && !r && $t !== null ? T.Me(t, ie, $t) : t.ce = ie, o && (t._e = h)) : (t._e = ie, C !== null && (t.we !== C && (t.we = C, C.Gn.push(t)), r && C.In.add(t), xn(t) && t.T.notify(t, 1, 1, new e(t))), v && (t.ve = !0), t.C & 256 && T.Ve !== null && T.Ve(t, ie)), t.u !== null && (!c || o || t.o?.Fe !== i) ? Le(t, o || c) : c && !o && t.o.hn !== x && T.ke(t, ie);
			} else if (c) t._e === h && je(t), t._e = ie, v && (t.ve = !0), T.ke(t, ie);
			else if (t.rn != y) for (let e = t.u; e !== null; e = e.Ae) ot(e.ge, nt(e.ge));
		}
		if (!a && !t.o?._ && (f !== void 0 && Vt(t, f), m)) for (let e of m) e !== t && Ht(t, e);
		g && !(t.h & 5) && (Ht(t), Se());
	}
	let ue = t.Nn;
	r && (p && !(t.h & 1) || (ue === null ? t.Ie !== null : ue.Ne !== null)) && Se(), !t.o?._ && t._e === h && !(r && t.Xe) && (n || o || r === 3 ? Et(t) : (t.Nn?.Ne ?? t.Ie) && Ve.push(t)), $t = b;
	let de = (t.C & d) !== 0, fe = (t._e !== h || !de && t.o !== null && (t.o._n !== null || t.o.fn !== null) || !!(t.h & 5)) && (!n || C !== null || !!(t.h & 1));
	if (fe && (!t.we || c) ? je(t) : fe && (S === null || o) && !(t.h & 5) && (fe = !1, de || pt(t, !1, !0)), fe ? t.C |= u : t.C &= ~u, t.we && r && S !== t.we && C === null) {
		let e = t.pn;
		tt(t.we, () => en(t)), t.pn = e;
	}
	ae && (rt(t), w());
}
function tn(e) {
	if (!(e.oe & 68)) {
		if (e.oe & 1) for (let t = e.Ie; t; t = t.Ne) {
			let n = t.Oe, r = n.De || n;
			if (r.he && tn(r), e.oe & 2) break;
		}
		(e.oe & 130 || e.o?._ && e.be < x && !e.o?.Ce) && en(e), e.oe &= 376 | r;
	}
}
function nn(e, t) {
	let n = t?.transparent ?? !1, r = typeof t == "object" && !!t && "loadingValue" in t, i = {
		id: vt(t, n, D),
		C: (n ? 4 : 0) | !!t?.ownedWrite | (!D || t?.lazy ? 32 : 0) | (t?.sync ? 64 : 0) | (t?.H ? 2 : 0) | 0,
		xe: t?.equals ?? mn,
		qe: null,
		T: D?.T ?? E,
		Je: D?.Je ?? ee,
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
		_parent: D,
		un: null,
		gn: null,
		tn: null,
		oe: t?.lazy ? 512 : 0,
		h: r ? 0 : 4,
		be: x,
		_e: h,
		we: null,
		vn: -1,
		ve: r,
		o: null
	};
	return t?.unobserved && (rn(i).Hn = t.unobserved), un(i, t), i;
}
function rn(e) {
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
		id: vt(i, a, D),
		C: (a ? 4 : 0) | !!i?.ownedWrite | (i?.sync ? 64 : 0) | (i?.yn ?? 0) | 0,
		xe: !1,
		qe: null,
		T: D?.T ?? E,
		Je: D?.Je ?? ee,
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
		_parent: D,
		un: null,
		gn: null,
		tn: null,
		oe: 512,
		h: 4,
		be: x,
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
	return i?.unobserved && (rn(o).Hn = i.unobserved), un(o, ln), o;
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
	let n = D?.Wn ? D.qn : D;
	D && mt(D, e), n && (e.rn = n.rn + 1), T.Zn !== null && T.Zn(e), !t?.lazy && en(e, !0);
}
function dn(e, t, n = null) {
	let r = {
		xe: t?.equals ?? mn,
		C: +!!t?.ownedWrite | (t?.H ? 2 : 0),
		ce: e,
		u: null,
		mn: null,
		be: x,
		De: n,
		Ue: n?.o?.i || null,
		Yn: null,
		_e: h,
		we: null,
		vn: -1,
		o: null
	};
	return t?.unobserved && (rn(r).Hn = t.unobserved), n && pn(n, r), r;
}
var fn;
function pn(e, t) {
	let n = t.Ue;
	n !== null && (n.Yn = t), rn(e).i = t, e.C |= s;
}
function mn(e, t) {
	return e === t;
}
function hn(e, t) {
	if (T.jn === null && !Yt) return e();
	let n = Yt;
	Yt = !1;
	try {
		return T.jn === null ? e() : T.jn(e);
	} finally {
		Yt = n;
	}
}
function gn(e, t) {
	if (e.oe & 512) e.oe &= -513, en(e, !0);
	else if (e.oe & 64) {
		if (e.C & 32) {
			let t = e._parent;
			if (t !== null) {
				if (t.oe & 64) {
					e.C &= -33;
					return;
				}
				e.oe & 32 || mt(t, e);
			}
			en(e, !0);
		}
	} else t && tn(e);
}
function _n(e, t) {
	let n = t.pn;
	(n == null || Qe(n) !== e) && e.In.add(t);
}
function vn(e) {
	return S !== null && Qe(e) === Qe(S);
}
function yn(e, t) {
	let n = e.we;
	if (n === null || vn(n)) return !1;
	let r = Qe(n);
	_n(r, t);
	let i = r.le.get(e);
	return i ? i.add(t) : e.h & 1 && tt(r, () => t.T.notify(t, 1, 1, e.o._)), !0;
}
var bn = null;
function xn(e) {
	for (let t = e.T; t !== null; t = t._parent) if (t.te & 1) return !t.q;
	return !1;
}
function Sn(e, t = e.we) {
	if (!t || t === S || e?.o?.kn || D?.o?.kn) return;
	let n = D, r = S === null && !E.Jn;
	if (!(r && T.Xn)) {
		if (n.oe & 4 && !(n.C & 128) && (bn === null || bn === t) && (r || !T.Xn && xn(n))) {
			bn = t;
			return;
		}
		E.initTransition(t);
	}
}
function Cn(e, t, n, r) {
	return !!(!t || $t !== null && T.$n(e, n, t) || e._e === h || t.C & 16 || Xt && !r && yn(e, t) || e.C & 131072 && $t !== null && !Qt && !(t.C & 8192));
}
var wn = !1;
function Tn() {
	wn = !0;
}
function En(e, t = e.ce) {
	return E.Jn || e._e === h || e.C & 4194304 || e.o?.kn ? h : e.we === null || e.C & 16777216 ? t : e.o === null ? h : e.o.bn;
}
var Dn = [], On = [];
function kn(e) {
	return !E.Jn && e.o?.hn === x && !e.o?.kn;
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
		for (let e of Nn) T.Ve(e, e._e === h ? e.ce : e._e);
		Nn.length = 0;
	}
}
function Fn(e) {
	if (Qt) return T.et(e);
	let t = D;
	t?.Wn && (t = t.qn);
	let n = e, r = e.De || e;
	if (typeof n.he == "function" && gn(e, !1), !n.he && r === e && e.o?.Fe === void 0 && e.o?.sn === void 0 && S === null && $t === null && (!wn || e._e === h)) return t && Yt && jt(e, t), !t || e._e === h || t.C & 16 || Xt && yn(e, t) ? e.ce : (Sn(e), e._e);
	if (t && Yt && (jt(e, t, Zt), r.he)) {
		let n = nt(e);
		r.rn >= n.ln ? (lt(t), ct(n), tn(r)) : t.C & 65536 && tn(r);
		let i = r.rn;
		i >= t.rn && e._parent !== t && (t.rn = i + 1);
	}
	if (r.h & 1) {
		if (t && (!Xt || r.h & 4 || r.C & 2097152 || r.C & 1024 && T.tt(r) || !yn(r, t))) {
			if ($t === null || T.it(r)) throw !Yt && e !== t && jt(e, t), r.o?._;
		} else if (!t && r.h & 4 && !(An(e) && e.C & 8388608)) throw r.o?._;
	}
	if (r.he && r.h & 2) {
		if (Yt && r.be < x) return en(r), Fn(e);
		throw r.o?._;
	}
	let i = In(e, t, r, e.ce);
	return !t && r === e && typeof n.he == "function" && e.C & 32 && !(r.h & 1) && !e.u && !jn(e) && (kt.add(e), w()), i;
}
function In(t, n, r, i) {
	if (An(t)) {
		if (!(n && n.C & 8192) && !kn(t)) return n && t.C & 525312 ? T.ut(t, n) : _(t.o?.Fe);
		t.C |= c;
	}
	if ($t !== null && S !== null && n !== null && T.lt(t, r, n)) return i;
	let a = t._e !== h && !!(t.h & 4);
	if (a && !n) throw new e(null);
	let o = n && wn ? En(t, i) : h;
	return o === h ? Cn(t, n, r, a) ? i : (Sn(t), t._e) : (Mn(n), o);
}
function Ln(e) {
	if (E.Jn) return;
	let t = rn(e);
	t.bn === h && (t.bn = e._e, Dn.push(e), wn = !0);
}
function Rn(e) {
	E.Jn || e.C & 4194304 || (e.C |= p, On.push(e));
}
function zn(e, t) {
	if (e.we && S !== e.we && (E.Jn ? E.initTransition(e.we) : (Te.push(e.we), w())), e.C & 128) return T.ot(e, t);
	let n = e._e === h ? e.ce : e._e;
	if (typeof t == "function" && (t = t(n)), !(e.h & 4 || !e.xe || !e.xe(n, t))) return t;
	let r = e._e !== h;
	return r ? e.we !== null && Ln(e) : je(e), e._e = t, D !== null && Rn(e), e.C & 256 && T.Ve !== null && (T.Ve(e, t), E.Jn || Nn.push(e)), e.he !== void 0 && (e.be = x), r && e.vn === Ne && $t === null ? t : (Le(e), w(), t);
}
function Bn(e) {
	st(e, nt(e)), !(e.oe & 1024) && e._e === h && (je(e), w()), e.oe = e.oe & -4 | r, e.ct = x;
}
function Vn(e) {
	return e.we !== null && S !== e.we && !((e.De || e).oe & 1024);
}
function Hn(e) {
	e.oe |= 2, rt(e);
}
function Un(e, t) {
	let n = Vn(e);
	n && typeof t == "function" && (t = t(e.ce));
	let r = zn(e, t);
	return n ? Hn(e) : Bn(e), r;
}
function Wn(e, t) {
	let n = D, r = Yt;
	D = e, Yt = !1;
	try {
		return t();
	} finally {
		D = n, Yt = r;
	}
}
function Gn(e, t = !0) {
	let n = Xt;
	Xt = t;
	try {
		return e();
	} finally {
		Xt = n;
	}
}
//#endregion
//#region ../../node_modules/.bun/@solidjs+signals@2.0.0-rc.13/node_modules/@solidjs/signals/dist/prod/core/effect.js
function Kn(e, t, n, r) {
	let i = an(e, t, n, r?.user ? 2 : 1, r);
	en(i, !0), !r?.defer && i._e === h && (i.je === 2 || r?.schedule ? i.T.enqueue(i.je, Jn.bind(null, i)) : Jn(i, 4));
}
function qn(e, t) {
	let r = e === void 0 ? this.h : e, i = t === void 0 ? this.o?._ : t;
	if (r & 2) {
		if (this.T.notify(this, 1, 0), this.je === 2) {
			this.h & 2 && (this.Xe = !0, this.T.enqueue(this.je, this.An ??= Jn.bind(null, this)));
			return;
		}
		if (!this.T.notify(this, 2, 2)) throw De(n(i)), i;
	} else this.je === 1 && this.T.notify(this, 3, r, i);
}
function Jn(e, r) {
	if (!e.Xe || e.oe & 64) return;
	if (e.pn !== null && !Qe(e.pn).Rn && (r & 4 ? !e.o?.me : S !== null)) {
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
			if (!e.T.notify(e, 2, 2)) throw De(t), t;
		}
		return;
	}
	let i = e.o?._ == null, a = e.wn;
	e.wn = void 0;
	try {
		a?.(), e.wn = e.Qn(e.ce, e.xn);
	} catch (n) {
		if (rn(e)._ = new t(e, n), e.h |= 2, !e.T.notify(e, 2, 2)) throw De(n), n;
	} finally {
		e.xn = e.ce, e.Xe = !1, i && Et(e);
	}
}
T.Cn = Jn;
function Yn(e, t) {
	let n = () => {
		if (!(!r.Xe || r.oe & 64)) try {
			r.Xe = !1, en(r);
		} finally {}
	}, r = nn(() => {
		let t = r.wn;
		r.wn = void 0, t?.();
		let n = Gn(e);
		r.wn = n;
	}, {
		...t,
		lazy: !0
	});
	r.wn = void 0, r.C = r.C & -33 | 16, r.Xe = !0, r.je = 3, r.$e = n, rt(r), w();
}
sn(qn);
//#endregion
//#region ../../node_modules/.bun/@solidjs+signals@2.0.0-rc.13/node_modules/@solidjs/signals/dist/prod/signals.js
function Xn(e) {
	return xt(e);
}
function Zn(e) {
	let t = Fn.bind(null, e);
	return t[v] = e, t;
}
function Qn(e, t) {
	if (typeof e == "function") {
		let n = nn(e, t);
		return n.C &= -33, [Zn(n), Un.bind(null, n)];
	}
	let n = dn(e, t);
	return [Zn(n), zn.bind(null, n)];
}
function $n(e, t) {
	return Zn(nn(e, t));
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
	let t = bt();
	t && !(t.C & 16) ? Yn(() => hn(e), void 0) : E.enqueue(2, function t() {
		if (b.EE >= b.ln) return E.enqueue(2, t);
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
		ie: Ct(),
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
	}, s = nn(ur.bind(o), void 0);
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
		if (t === 0) this.wt !== 0 && (this.ie.dispose(!1), this.St = [], this.yt = [], this.Mt = [], this.wt = 0, this.jt &&= [], this.kt &&= []), this.bt && !this.Mt[0] && (this.St[0]?.dispose(), this.Mt[0] = Wn(this.St[0] = Ct(), this.bt));
		else if (this.wt === 0) {
			let s = Array(t), c = Array(t);
			i = this.jt && Array(t), a = this.kt && Array(t);
			try {
				for (r = 0; r < t; r++) s[r] = Wn(c[r] = Ct(), o);
			} catch (e) {
				for (n = 0; n <= r; n++) c[n]?.dispose();
				throw e;
			}
			this.St[0] && this.St[0].dispose(), this.Mt = s, this.St = c, i && (this.jt = i), a && (this.kt = a), this.yt = e.slice(0), this.wt = t;
		} else {
			let s, c, l, u, d, f, p, m, h, g = (this.Wt = $t !== null || this.Wt && te.size !== 0) ? T.st : zn;
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
			let _ = t - this.wt, ee = Array(t), v = Array(t);
			for (i = this.jt ? Array(t) : void 0, a = this.kt ? Array(t) : void 0, f = /* @__PURE__ */ new Map(), p = Array(l + 1), r = l; r >= s; r--) u = e[r], d = this.Kn ? this.Kn(u) : u, n = f.get(d), p[r] = n === void 0 ? -1 : n, f.set(d, r);
			for (n = s; n <= c; n++) u = this.yt[n], d = this.Kn ? this.Kn(u) : u, r = f.get(d), r !== void 0 && r !== -1 ? (ee[r] = this.Mt[n], v[r] = this.St[n], i && (i[r] = this.jt[n]), a && (a[r] = this.kt[n]), r = p[r], f.set(d, r)) : (m ??= []).push(this.St[n]);
			try {
				for (r = s; r <= l; r++) v[r] === void 0 && ((h ??= []).push(v[r] = Ct()), ee[r] = Wn(v[r], o));
			} catch (e) {
				if (h) for (n = 0; n < h.length; n++) h[n].dispose();
				throw e;
			}
			for (n = 0; n < s; n++) ee[n] = this.Mt[n], v[n] = this.St[n], i && (i[n] = this.jt[n]), a && (a[n] = this.kt[n]);
			for (r = s; r <= l; r++) i && g(i[r], e[r]), a && g(a[r], r);
			for (r = l + 1; r < t; r++) ee[r] = this.Mt[r - _], v[r] = this.St[r - _], i && (i[r] = this.jt[r - _], g(i[r], e[r])), a && (a[r] = this.kt[r - _], _ !== 0 && g(a[r], r));
			if (this.Mt = ee, this.St = v, i && (this.jt = i), a && (this.kt = a), this.wt = t, this.yt = e.slice(0), m) for (n = 0; n < m.length; n++) m[n].dispose();
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
}, Er = (...e) => $n(...e), Dr = (...e) => Qn(...e), Or = (...e) => wt(...e), kr = (...e) => tr(...e), Ar = (...e) => er(...e);
function O(e, t, n) {
	return hn(() => e(t || {}));
}
var jr = (e) => `Stale read from <${e}>.`;
function Mr(e) {
	let t = "fallback" in e ? {
		keyed: e.keyed,
		fallback: () => e.fallback
	} : { keyed: e.keyed }, n = bt(), r, i = () => Wn(n, () => or(() => e.each, e.children, t));
	return Tr.hydrating && (r = i()), () => (r ??= i())();
}
function k(e) {
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
var Nr = Tr, Pr = /*#__PURE__*/ Symbol("slot"), Fr = /*#__PURE__*/ Symbol("host"), Ir = {
	transparent: !0,
	sync: !0
}, Lr = { sync: !0 };
function A(e, t, n) {
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
var Br = "_$$", Vr = "_$SOLID_EVENT_OWNER", Hr = Object.prototype.hasOwnProperty, Ur = {}, Wr = /* @__PURE__ */ new Set(), Gr = /* @__PURE__ */ new Map();
function Kr(e, t, n, r = {}) {
	let i;
	Yr(t);
	try {
		Or((a) => {
			if (i = a, r.onError && (bt()[Ee] = r.onError), t === document) {
				let t = e();
				A(() => fr(t), () => {});
			} else {
				let i = e();
				F(t, () => i, t.firstChild ? null : void 0, n, {
					...r.insertOptions,
					schedule: !0
				});
			}
		}, { id: r.renderId }), qe();
	} catch (e) {
		throw i && i(), Xr(t), e;
	}
	return () => {
		i(), Xr(t), t.textContent = "";
	};
}
function qr(e, t, n) {
	let r = document.createElement("template");
	return r.innerHTML = e, n === 2 ? r.content.firstChild.firstChild : r.content.firstChild;
}
function j(e, t) {
	let n;
	return t === 1 ? (r) => document.importNode(n ||= qr(e, r, t), !0) : (r) => (n ||= qr(e, r, t)).cloneNode(!0);
}
function Jr(e) {
	for (let t = 0, n = e.length; t < n; t++) {
		let n = e[t];
		Wr.has(n) || (Wr.add(n), Gr.forEach((e, t) => $r(n, t, e)));
	}
}
function Yr(e) {
	let t = Zr(e, e);
	t && (t.roots = (t.roots || 0) + 1);
}
function Xr(e) {
	let t = Gr.get(e);
	t && (t.roots > 1 ? t.roots-- : delete t.roots), Qr(e, e);
}
function Zr(e, t = e) {
	if (!e || !t) return;
	let n = Gr.get(e);
	return n || Gr.set(e, n = {
		owners: /* @__PURE__ */ new Map(),
		handlers: /* @__PURE__ */ new Map()
	}), n.owners.set(t, (n.owners.get(t) || 0) + 1), Wr.forEach((t) => $r(t, e, n)), n;
}
function Qr(e, t = e) {
	let n = Gr.get(e);
	if (!n) return;
	let r = n.owners.get(t);
	r > 1 ? n.owners.set(t, r - 1) : n.owners.delete(t), !n.owners.size && (n.handlers.forEach((t, n) => e.removeEventListener(n, t)), Gr.delete(e));
}
function $r(e, t, n) {
	if (n.handlers.has(e)) return;
	let r = (e) => pi(e, t, n);
	n.handlers.set(e, r), t.addEventListener(e, r);
}
function ei(e) {
	for (; e;) {
		if (Gr.get(e)?.roots) return e;
		e = e._$host || e.parentNode || e.host;
	}
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
function M(e, t, n) {
	if (ui(e)) return;
	let r = t === "multiple" && e.localName === "select";
	if (n == null || n === !1) e.removeAttribute(t);
	else if (e.setAttribute(t, n === !0 ? "" : n), r && !e._$multiple) {
		let t = e.options;
		for (let e = 0; e < t.length; e++) t[e].defaultSelected && (t[e].selected = !0);
	}
	r && (e._$multiple = !0), ni !== null && (t === "href" || t === "action") && ri(e);
}
function N(e, t, n) {
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
		(n || e._$styles) && (M(e, "style"), e._$styles = void 0);
		return;
	}
	let r = e.style;
	if (typeof t == "string") return e._$styles = void 0, r.cssText = t;
	typeof n == "string" && (r.cssText = "", n = void 0);
	let i = e._$styles;
	i ||= e._$styles = n ? { ...n } : {};
	let a, o;
	for (o in i) (!Hr.call(t, o) || t[o] == null) && (r.removeProperty(o), delete i[o]);
	for (o in t) Hr.call(t, o) && (a = t[o], a != null && a !== i[o] && (r.setProperty(o, a), i[o] = a));
}
function P(e) {
	if (typeof e != "object" || !e) return e;
	if (Array.isArray(e)) return e.map(P);
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
function F(e, t, n, r, i) {
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
	A((r) => {
		li !== null && (s = li.reclaimRegion(s, e, n));
		let c = hi(t(), s, a, !0);
		return typeof c == "function" ? (A(() => (li !== null && (s = li.reclaimRegion(s, e, n)), hi(c, s, a)), (t) => {
			s = mi(e, t, s, n), o && gi(s, o);
		}, r !== void 0 && !(i && i.schedule) ? {
			...i,
			schedule: !0
		} : i), Ur) : c;
	}, (t) => {
		t !== Ur && (s = mi(e, t, s, n), o && gi(s, o));
	}, t.$s ? i ? {
		...i,
		scope: !0
	} : ci : i);
}
function ui(e) {
	if (!Nr.hydrating || Nr.isClaiming && !Nr.isClaiming()) return !1;
	if (!e || e.isConnected) return !0;
	let t = Nr.claimRoots;
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
	let r = e[Vr], i;
	if (r) {
		if (r === !0 || r === t || !t.contains(r)) return;
		i = r;
	}
	let a = n && (n.owners.size === 1 && n.owners.has(t) ? t : ti(e.target, n)?.owner);
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
	else if (t.nodeType) Array.isArray(n) ? bi(e, n, a ? r : null, t) : n != null && n.nodeType ? n.parentNode === e ? e.replaceChild(t, n) : e.appendChild(t) : n != null && e.firstChild ? e.replaceChild(t, e.firstChild) : e.appendChild(t), r && (t[Pr] = r);
	else if (Array.isArray(t)) {
		let i = Array.isArray(n);
		for (let e = 0, r = t.length; e < r; e++) {
			let r = t[e], a = typeof r;
			if (a === "string" || a === "number") {
				let a = i ? n[e] : void 0;
				a && a.nodeType === 3 ? (a.data !== "" + r && (a.data = r), t[e] = a) : t[e] = document.createTextNode(r);
			}
		}
		t.length === 0 ? bi(e, n, r) : i ? n.length === 0 ? _i(e, t, r) : zr(e, n, t, r) : (n != null && bi(e, n), _i(e, t));
	}
	return t;
}
function hi(e, t, n, r) {
	if (e = fr(e, {
		skipNonRendered: !0,
		doNotUnwrap: r
	}), r && typeof e == "function") return e;
	if (n && !Array.isArray(e) && (e = [e ?? ""]), Nr.hydrating && Array.isArray(e)) for (let n = 0, r = e.length; n < r; n++) {
		let r = e[n], i = t && t[n], a = typeof r;
		(a === "string" || a === "number") && i && i.nodeType === 3 && ui(i) && (e[n] = i);
	}
	return e;
}
function gi(e, t) {
	if (Array.isArray(e)) for (let n = 0, r = e.length; n < r; n++) gi(e[n], t);
	else e && e.nodeType && e[Fr] !== t && (e[Fr] = t, Object.defineProperty(e, "_$host", {
		get: t,
		configurable: !0
	}));
}
function _i(e, t, n = null) {
	for (let r = 0, i = t.length; r < i; r++) {
		let i = t[r];
		e.insertBefore(i, n), n && (i[Pr] = n);
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
				let t = o[Pr], s = o.parentNode === e && (!t || t === n);
				r && !i && !a ? s ? e.replaceChild(r, o) : e.insertBefore(r, n) : s && o.remove();
			} else i = !0;
		}
	} else r && e.insertBefore(r, n);
	r && n && (r[Pr] = n);
}
function xi(e) {
	return Wn(Ct(), () => Si(e));
}
function Si(e) {
	let t = document.createTextNode(""), n = document.createTextNode(""), r = document.createTextNode(""), i = () => e.mount || document.body, a = Er(() => [n, e.children], {
		ssrSource: "client",
		loadingValue: void 0
	});
	return kr(() => [
		i(),
		a(),
		bt()
	], ([, e, a]) => {
		let o = hn(i);
		o.appendChild(r);
		let s = Wn(a, () => Or((n) => (F(o, e, r, void 0, { host: () => t.parentNode }), n)));
		return () => {
			s();
			let e = n;
			for (; e;) {
				let t = e.nextSibling;
				if (o.removeChild(e), e === r) break;
				e = t;
			}
		};
	}, {
		schedule: !0,
		ssrSource: "client"
	}), Ar(i, () => {
		let e = hn(i), n = ei(t);
		if (n && !n.contains(e)) return Zr(e, n), () => Qr(e, n);
	}, { ssrSource: "client" }), Nr.hydrating ? Er(() => t, {
		ssrSource: "client",
		loadingValue: void 0
	}) : t;
}
//#endregion
//#region ../cssints/dist/runtime.mjs
function Ci(e, ...t) {
	let n = t.flat(Infinity).filter(Boolean).join(" ").split(" "), r = e.flatMap(([e, t]) => n.includes(e) ? t.split(" ") : []);
	return n.filter((e) => e && !r.includes(e)).join(" ");
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/Pipeable.js
var wi = (e, t) => {
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
}, Ti = { pipe() {
	return wi(this, arguments);
} }, Ei = /*#__PURE__*/ function() {
	function e() {}
	return e.prototype = Ti, e;
}(), I = function(e, t) {
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
}, L = (e) => e, Di = (e) => () => e, Oi = /*#__PURE__*/ Di(!0), ki = /*#__PURE__*/ Di(!1), Ai = /*#__PURE__*/ Di(void 0), ji = Ai;
function Mi(e) {
	let t = /* @__PURE__ */ new WeakMap();
	return (n) => {
		let r = t.get(n);
		if (r !== void 0) return r;
		let i = e(n);
		return t.set(n, i), i;
	};
}
function Ni(e) {
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
var Pi = (e) => {
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
}, Fi = /*#__PURE__*/ new WeakSet(), Ii = (e) => new Uint8Array(e.buffer, e.byteOffset, e.byteLength), Li = 0, Ri = () => {
	Li++;
};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/Predicate.js
function zi(e) {
	return typeof e == "string";
}
function Bi(e) {
	return typeof e == "number";
}
function Vi(e) {
	return typeof e == "symbol";
}
function Hi(e) {
	return zi(e) || Bi(e) || Vi(e);
}
function Ui(e) {
	return typeof e == "function";
}
function Wi(e) {
	return e != null;
}
function Gi(e) {
	return !0;
}
function Ki(e) {
	return typeof e == "object" && !!e || Ui(e);
}
var R = /*#__PURE__*/ I(2, (e, t) => Ki(e) && t in e), qi = /*#__PURE__*/ I(2, (e, t) => R(e, "_tag") && e._tag === t), Ji = "~effect/Hash", z = (e) => {
	switch (typeof e) {
		case "number": return ea(e);
		case "bigint": return ta(e.toString(10));
		case "string": return ta(e);
		case "function":
		case "object":
			if (e === null) break;
			if (e instanceof Date) return Number.isNaN(e.getTime()) ? ta("Invalid Date") : ta(e.toISOString());
			if (e instanceof RegExp) return ta(e.toString());
			{
				if (Fi.has(e)) return Yi(e);
				let t = ua.get(e);
				if (t !== void 0) return t;
				if (da.has(e)) return Ri(), ta("[Circular]");
				da.add(e);
				let n = Li, r;
				try {
					r = "~effect/Hash" in e ? e[Ji]() : typeof e == "function" ? Yi(e) : e instanceof DataView ? aa(Ii(e)) : Array.isArray(e) || ArrayBuffer.isView(e) ? aa(e) : e instanceof Map ? oa(e) : e instanceof Set ? ca(e) : ra(e);
				} finally {
					da.delete(e);
				}
				return n === Li && ua.set(e, r), r;
			}
	}
	return Qi(Xi(ta(String(e))));
}, Yi = (e) => (la.has(e) || la.set(e, Qi(Math.random() * 4294967296 | 0)), la.get(e)), Xi = (e) => (e ^= e >>> 16, e = Math.imul(e, 2246822507), e ^= e >>> 13, e = Math.imul(e, 3266489909), e ^ e >>> 16), Zi = /*#__PURE__*/ I(2, (e, t) => Xi(Math.imul(e, 2654435761) + Math.imul(t, 2246822507))), Qi = (e) => e & 3221225471 | e >>> 1 & 1073741824, $i = /*#__PURE__*/ new DataView(/*#__PURE__*/ new ArrayBuffer(8)), ea = (e) => {
	let t = e | 0;
	return t === e ? Qi(t) : ($i.setFloat64(0, e === e ? e : NaN), Qi(Zi($i.getInt32(0), $i.getInt32(4))));
}, ta = (e) => {
	let t = 5381, n = e.length;
	for (; n;) t = t * 33 ^ e.charCodeAt(--n);
	return Qi(t);
}, na = (e, t) => {
	let n = 12289;
	for (let r of t) n ^= Zi(z(r), z(e[r]));
	return Qi(n);
}, ra = (e) => na(e, Pi(e)), ia = (e, t) => (n) => {
	let r = e;
	for (let e of n) r ^= t(e);
	return Qi(r);
}, aa = (e) => {
	let t = 6151;
	for (let n of e) t = Zi(t, z(n));
	return Qi(t);
}, oa = /*#__PURE__*/ ia(/*#__PURE__*/ ta("Map"), ([e, t]) => Zi(z(e), z(t))), sa = /*#__PURE__*/ ta("Set"), ca = /*#__PURE__*/ ia(sa, (e) => Zi(sa, z(e))), la = /*#__PURE__*/ new WeakMap(), ua = /*#__PURE__*/ new WeakMap(), da = /*#__PURE__*/ new WeakSet(), fa = "~effect/Equal";
function pa() {
	return arguments.length === 1 ? (e) => ma(e, arguments[0]) : ma(arguments[0], arguments[1]);
}
function ma(e, t) {
	if (e === t) return !0;
	if (e == null || t == null) return !1;
	let n = typeof e;
	return n === typeof t ? n === "number" && e !== e && t !== t ? !0 : n !== "object" && n !== "function" || Fi.has(e) || Fi.has(t) ? !1 : ha(e, t) : !1;
}
function ha(e, t) {
	let n = _a.length;
	for (let r = n; r-- > 0;) if (_a[r] === e && va[r] === t) return !0;
	if (n) return ga(e, t);
	let r = ya.get(e);
	r || ya.set(e, r = /* @__PURE__ */ new WeakMap());
	let i = r.get(t);
	return i === void 0 && r.set(t, i = ga(e, t)), i;
}
function ga(e, t) {
	_a.push(e), va.push(t);
	try {
		return ba(e, t);
	} finally {
		_a.pop(), va.pop();
	}
}
var _a = [], va = [], ya = /*#__PURE__*/ new WeakMap();
function ba(e, t) {
	if (z(e) !== z(t)) return !1;
	if (e instanceof Date) {
		if (!(t instanceof Date)) return !1;
		let n = e.getTime(), r = t.getTime();
		return n === r || Number.isNaN(n) && Number.isNaN(r);
	}
	if (e instanceof RegExp) return t instanceof RegExp && e.toString() === t.toString();
	let n = Da(e);
	if (n !== Da(t) || typeof e == "function" && !n) return !1;
	if (n) return e[fa](t);
	if (Array.isArray(e)) return !Array.isArray(t) || e.length !== t.length ? !1 : xa(e, t);
	if (ArrayBuffer.isView(e)) {
		let n = e instanceof DataView;
		return !ArrayBuffer.isView(t) || e.byteLength !== t.byteLength || n !== t instanceof DataView ? !1 : n ? Sa(Ii(e), Ii(t)) : Sa(e, t);
	}
	return e instanceof Map ? !(t instanceof Map) || e.size !== t.size ? !1 : wa(e, t, Ta, Ea) : e instanceof Set ? !(t instanceof Set) || e.size !== t.size ? !1 : wa(e, t, z, ma) : Ca(e, t);
}
function xa(e, t) {
	for (let n = 0; n < e.length; n++) if (!ma(e[n], t[n])) return !1;
	return !0;
}
function Sa(e, t) {
	if (e.length !== t.length) return !1;
	for (let n = 0; n < e.length; n++) if (e[n] !== t[n]) return !1;
	return !0;
}
function Ca(e, t) {
	let n = Pi(e), r = Pi(t);
	if (n.size !== r.size) return !1;
	for (let i of n) if (!r.has(i) || !ma(e[i], t[i])) return !1;
	return !0;
}
function wa(e, t, n, r) {
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
var Ta = (e) => z(e[0]), Ea = (e, t) => ma(e[0], t[0]) && ma(e[1], t[1]), Da = (e) => R(e, fa), Oa = /*#__PURE__*/ Symbol.for("~effect/Redactable"), ka = (e) => R(e, Oa);
function Aa(e) {
	return ka(e) ? ja(e) : e;
}
function ja(e) {
	return e[Oa](globalThis["~effect/Fiber/currentFiber"]?.context ?? Pa);
}
var Ma = "~effect/Fiber/currentFiber", Na = /*#__PURE__*/ new Map(), Pa = {
	"~effect/Context": {},
	base: Na,
	depth: 0,
	mapUnsafe: Na,
	pipe() {
		return wi(this, arguments);
	}
};
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/Formatter.js
function Fa(e, t) {
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
			if (r.has(e)) return Ia;
			r.add(e);
			let l;
			if (Oa in e) l = c(ja(e), n);
			else if (Array.isArray(e)) l = !i || e.length <= 1 ? `[${e.map((e) => c(e, n)).join(",")}]` : `[\n${a(n + 1)}${e.map((e) => c(e, n + 1)).join(",\n" + a(n + 1))}\n${a(n)}]`;
			else if (e instanceof Date) l = za(e);
			else if (!t?.ignoreToString && R(e, "toString") && typeof e.toString == "function" && e.toString !== Object.prototype.toString && e.toString !== Array.prototype.toString) {
				let t = Ba(e);
				l = e instanceof Error && e.cause !== void 0 ? `${t} (cause: ${c(e.cause, n)})` : t;
			} else if (Symbol.iterator in e) l = `${e.constructor.name}(${c(Array.from(e), n)})`;
			else {
				let t = s(e);
				if (!i || t.length <= 1) {
					let r = `{${t.map((t) => `${La(t)}:${c(Va(e, t), n)}`).join(",")}}`;
					l = o(e, r);
				} else {
					let r = `{\n${t.map((t) => `${a(n + 1)}${La(t)}: ${c(Va(e, t), n + 1)}`).join(",\n")}\n${a(n)}}`;
					l = o(e, r);
				}
			}
			return r.delete(e), l;
		}
		return String(e);
	}
	return c(e, 0);
}
var Ia = "[Circular]";
function La(e) {
	return typeof e == "string" ? JSON.stringify(e) : String(e);
}
function Ra(e) {
	return e.map((e) => `[${La(e)}]`).join("");
}
function za(e) {
	try {
		return e.toISOString();
	} catch {
		return "Invalid Date";
	}
}
function Ba(e) {
	try {
		let t = e.toString();
		return typeof t == "string" ? t : String(t);
	} catch {
		return "[toString threw]";
	}
}
function Va(e, t) {
	try {
		return e[t];
	} catch {
		return "[property access threw]";
	}
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/Inspectable.js
var Ha = /*#__PURE__*/ Symbol.for("nodejs.util.inspect.custom"), Ua = (e) => {
	try {
		return e = Aa(e), R(e, "toJSON") && Ui(e.toJSON) && e.toJSON.length === 0 ? e.toJSON() : Array.isArray(e) ? e.map(Ua) : e;
	} catch {
		return "[toJSON threw]";
	}
}, Wa = {
	toJSON() {
		return Ua(this);
	},
	[Ha]() {
		return this.toJSON();
	},
	toString() {
		return Fa(this.toJSON());
	}
}, Ga = /*#__PURE__*/ (() => {
	let e = Object.getOwnPropertyDescriptor(Error, "stackTraceLimit");
	return e === void 0 ? Object.isExtensible(Error) : Object.hasOwn(e, "writable") ? e.writable === !0 : e.set !== void 0;
})(), Ka = () => Error.stackTraceLimit, qa = (e) => {
	Ga && (Error.stackTraceLimit = e);
}, Ja = class {
	constructor(e) {
		this.value = e, this.done = !1;
	}
	next(e) {
		return this.done ? (this.value = e, this) : (this.done = !0, {
			value: this.value,
			done: !1
		});
	}
}, Ya = /*#__PURE__*/ (() => {
	let e = "~effect/Utils/internal", t = { [e]: (e) => e() }, n = { [e]: (e) => {
		try {
			return e();
		} finally {}
	} };
	return Ka() !== 0 && t[e](() => (/* @__PURE__ */ Error()).stack)?.includes(e) === !0 ? t[e] : n[e];
})();
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/internal/record.js
function Xa(e, t, n) {
	t === "__proto__" ? Object.defineProperty(e, t, {
		value: n,
		writable: !0,
		enumerable: !0,
		configurable: !0
	}) : e[t] = n;
}
function Za(e, t) {
	for (let n of Reflect.ownKeys(t)) Object.prototype.propertyIsEnumerable.call(t, n) && Xa(e, n, t[n]);
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/internal/core.js
var Qa = "~effect/Effect", $a = "~effect/Exit", eo = {
	_A: L,
	_E: L,
	_R: L
}, to = `${Qa}/identifier`, B = `${Qa}/args`, V = `${Qa}/evaluate`, no = `${Qa}/successCont`, ro = `${Qa}/failureCont`, io = `${Qa}/ensureCont`, ao = /*#__PURE__*/ Symbol.for("effect/Effect/Yield"), oo = {
	pipe() {
		return wi(this, arguments);
	},
	toJSON() {
		return { ...this };
	},
	toString() {
		return Fa(this.toJSON(), {
			ignoreToString: !0,
			space: 2
		});
	},
	[Ha]() {
		return this.toJSON();
	}
}, so = {
	[Qa]: eo,
	...oo,
	[Symbol.iterator]() {
		return new Ja(this);
	},
	toJSON() {
		return {
			_id: "Effect",
			op: this[to],
			...B in this ? { args: this[B] } : void 0
		};
	}
}, co = (e) => R(e, Qa), lo = (e) => R(e, $a), uo = "~effect/Cause", fo = "~effect/Cause/Reason", po = (e) => R(e, uo), mo = class {
	constructor(e) {
		this[uo] = uo, this.reasons = e;
	}
	pipe() {
		return wi(this, arguments);
	}
	toJSON() {
		return {
			_id: "Cause",
			failures: this.reasons.map((e) => e.toJSON())
		};
	}
	toString() {
		return `Cause(${Fa(this.reasons)})`;
	}
	[Ha]() {
		return this.toJSON();
	}
	[fa](e) {
		return po(e) && this.reasons.length === e.reasons.length && this.reasons.every((t, n) => pa(t, e.reasons[n]));
	}
	[Ji]() {
		return aa(this.reasons);
	}
}, ho = /*#__PURE__*/ new WeakMap(), go = class {
	[fo];
	annotations;
	_tag;
	constructor(e, t, n) {
		if (this[fo] = fo, this._tag = e, t !== _o && typeof n == "object" && n && t.size > 0) {
			let e = ho.get(n);
			e && (t = new Map([...e, ...t])), ho.set(n, t);
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
		return wi(this, arguments);
	}
	toString() {
		return Fa(this);
	}
	[Ha]() {
		return this.toString();
	}
}, _o = /*#__PURE__*/ new Map(), vo = class extends go {
	constructor(e, t = _o) {
		super("Fail", t, e), this.error = e;
	}
	toString() {
		return `Fail(${Fa(this.error)})`;
	}
	toJSON() {
		return {
			_tag: "Fail",
			error: this.error
		};
	}
	[fa](e) {
		return wo(e) && pa(this.error, e.error) && pa(this.annotations, e.annotations);
	}
	[Ji]() {
		return Zi(ta(this._tag))(Zi(z(this.error))(z(this.annotations)));
	}
}, yo = (e) => new mo(e), bo = (e) => new mo([new vo(e)]), xo = class extends go {
	constructor(e, t = _o) {
		super("Die", t, e), this.defect = e;
	}
	toString() {
		return `Die(${Fa(this.defect)})`;
	}
	toJSON() {
		return {
			_tag: "Die",
			defect: this.defect
		};
	}
	[fa](e) {
		return To(e) && pa(this.defect, e.defect) && pa(this.annotations, e.annotations);
	}
	[Ji]() {
		return Zi(ta(this._tag))(Zi(z(this.defect))(z(this.annotations)));
	}
}, So = (e) => new mo([new xo(e)]), Co = /*#__PURE__*/ I((e) => po(e[0]), (e, t, n) => t.mapUnsafe.size === 0 ? e : new mo(e.reasons.map((e) => e.annotate(t, n)))), wo = (e) => e._tag === "Fail", To = (e) => e._tag === "Die", Eo = (e) => e._tag === "Interrupt";
function Do(e) {
	return Fo("Effect.evaluate: Not implemented");
}
var Oo = (e) => ({
	...so,
	[to]: e.op,
	[V]: e[V] ?? Do,
	[no]: e[no],
	[ro]: e[ro],
	[io]: e[io]
}), ko = (e) => {
	let t = Oo(e), n = function(e) {
		this[B] = e;
	};
	return n.prototype = t, function(e) {
		return new n(e);
	};
}, Ao = (e) => {
	let t = {
		[$a]: $a,
		_tag: e.op,
		get [e.prop]() {
			return this[B];
		},
		...Oo(e),
		toString() {
			return `${e.op}(${Fa(this[B])})`;
		},
		toJSON() {
			return {
				_id: "Exit",
				_tag: e.op,
				[e.prop]: this[B]
			};
		},
		[fa](e) {
			return lo(e) && e._tag === this._tag && pa(this[B], e[B]);
		},
		[Ji]() {
			return Zi(ta(e.op), z(this[B]));
		}
	}, n = function(e) {
		this[B] = e;
	};
	return n.prototype = t, function(e) {
		return new n(e);
	};
}, H = /*#__PURE__*/ Ao({
	op: "Success",
	prop: "value",
	[V](e) {
		let t = e.getCont(no);
		return t ? t[no](this[B], e, this) : e.yieldWith(this);
	}
}), jo = { key: "effect/Cause/StackTrace" }, Mo = { key: "effect/Cause/InterruptorStackTrace" }, No = /*#__PURE__*/ Ao({
	op: "Failure",
	prop: "cause",
	[V](e) {
		let t = this[B], n = !1;
		e.cache.stackFrame && (t = Co(t, { mapUnsafe: /* @__PURE__ */ new Map([[jo.key, e.cache.stackFrame]]) }), n = !0);
		let r = e.getCont(ro);
		for (; e.interruptible && e._interruptedCause && r;) r = e.getCont(ro);
		return r ? r[ro](t, e, n ? void 0 : this) : e.yieldWith(n ? No(t) : this);
	}
}), Po = (e) => No(bo(e)), Fo = (e) => No(So(e)), U = /*#__PURE__*/ ko({
	op: "WithFiber",
	[V](e) {
		return this[B](e);
	}
}), Io = /*#__PURE__*/ function() {
	class e extends globalThis.Error {}
	let t = /*#__PURE__*/ Oo({
		op: "YieldableError",
		[V]() {
			return Po(this);
		}
	});
	return delete t.toString, Object.assign(e.prototype, t), e;
}(), Lo = /*#__PURE__*/ function() {
	let e = /*#__PURE__*/ Symbol.for("effect/Data/Error/plainArgs");
	return class extends Io {
		constructor(t) {
			super(t?.message, t?.cause ? { cause: t.cause } : void 0), t && (Za(this, t), Object.defineProperty(this, e, {
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
}(), Ro = (e) => {
	class t extends Lo {
		_tag = e;
	}
	return t.prototype.name = e, t;
}, zo = "~effect/Cause/Done", Bo = (e) => R(e, zo), Vo = {
	[zo]: zo,
	_tag: "Done",
	value: void 0
}, Ho = (e) => e === void 0 ? Vo : {
	[zo]: zo,
	_tag: "Done",
	value: e
}, Uo = /*#__PURE__*/ Po(Vo), Wo = (e) => e === void 0 ? Uo : Po(Ho(e)), Go = (e) => Oo({
	op: e.label,
	[V]: e.evaluate
}), Ko = "~effect/Option", qo = {
	[Ko]: { _A: (e) => e },
	...oo,
	[Symbol.iterator]() {
		return new Ja(this);
	}
}, Jo = /*#__PURE__*/ Object.defineProperty(/*#__PURE__*/ Object.assign(/*#__PURE__*/ Object.create(qo), {
	_tag: "Some",
	_op: "Some",
	[fa](e) {
		return Zo(e) && $o(e) && pa(this.value, e.value);
	},
	[Ji]() {
		return Zi(z(this._tag))(z(this.value));
	},
	toString() {
		return `some(${Fa(this.value)})`;
	},
	toJSON() {
		return {
			_id: "Option",
			_tag: this._tag,
			value: Ua(this.value)
		};
	}
}), "valueOrUndefined", { get() {
	return this.value;
} }), Yo = /*#__PURE__*/ z("None"), Xo = /*#__PURE__*/ Object.assign(/*#__PURE__*/ Object.create(qo), {
	_tag: "None",
	_op: "None",
	valueOrUndefined: void 0,
	[fa](e) {
		return Zo(e) && Qo(e);
	},
	[Ji]() {
		return Yo;
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
}), Zo = (e) => R(e, Ko), Qo = (e) => e._tag === "None", $o = (e) => e._tag === "Some", es = /*#__PURE__*/ Object.create(Xo), ts = function(e) {
	this.value = e;
};
ts.prototype = Jo;
var ns = (e) => new ts(e), rs = "~effect/Result", is = {
	[rs]: {
		/* v8 ignore next 2 */
		_A: (e) => e,
		_E: (e) => e
	},
	...oo,
	[Symbol.iterator]() {
		return new Ja(this);
	}
}, as = /*#__PURE__*/ Object.assign(/*#__PURE__*/ Object.create(is), {
	_tag: "Success",
	_op: "Success",
	[fa](e) {
		return ss(e) && ls(e) && pa(this.success, e.success);
	},
	[Ji]() {
		return Zi(z(this._tag))(z(this.success));
	},
	toString() {
		return `success(${Fa(this.success)})`;
	},
	toJSON() {
		return {
			_id: "Result",
			_tag: this._tag,
			value: Ua(this.success)
		};
	}
}), os = /*#__PURE__*/ Object.assign(/*#__PURE__*/ Object.create(is), {
	_tag: "Failure",
	_op: "Failure",
	[fa](e) {
		return ss(e) && cs(e) && pa(this.failure, e.failure);
	},
	[Ji]() {
		return Zi(z(this._tag))(z(this.failure));
	},
	toString() {
		return `failure(${Fa(this.failure)})`;
	},
	toJSON() {
		return {
			_id: "Result",
			_tag: this._tag,
			failure: Ua(this.failure)
		};
	}
}), ss = (e) => R(e, rs), cs = (e) => e._tag === "Failure", ls = (e) => e._tag === "Success", us = function(e) {
	this.failure = e;
};
us.prototype = os;
var ds = (e) => new us(e), fs = function(e) {
	this.success = e;
};
fs.prototype = as;
var ps = (e) => new fs(e);
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/Order.js
function ms(e) {
	return (t, n) => t === n ? 0 : e(t, n);
}
var hs = /*#__PURE__*/ ms((e, t) => e < t ? -1 : 1), gs = /*#__PURE__*/ ms((e, t) => globalThis.Number.isNaN(e) && globalThis.Number.isNaN(t) ? 0 : globalThis.Number.isNaN(e) ? -1 : globalThis.Number.isNaN(t) ? 1 : e < t ? -1 : 1), _s = /*#__PURE__*/ I(2, (e, t) => ms((n, r) => e(t(n), t(r)))), vs = (e) => I(2, (t, n) => e(t, n) === 1), ys = () => es, bs = ns, xs = Qo, Ss = $o, Cs = /*#__PURE__*/ (/* @__PURE__ */ I(2, (e, t) => xs(e) ? t() : e.value))(Ai), ws = "~effect/Context/Service", Ts = function() {
	function e() {}
	let t = e;
	Object.setPrototypeOf(t, Es);
	let n = (e, n) => (t.key = e, n?.defaultValue && (t[Os] = Os, t.defaultValue = n.defaultValue), n?.make && (t.make = n.make), n?.fiberCached && Ds.add(e), t);
	return arguments.length > 0 ? n(arguments[0], arguments[1]) : n;
}, Es = {
	[ws]: ws,
	.../*#__PURE__*/ Go({
		label: "Service",
		evaluate(e) {
			return H(Zs(e.context, this));
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
		return Gs(this, e);
	},
	use(e) {
		return U((t) => e(Zs(t.context, this)));
	},
	useSync(e) {
		return U((t) => H(e(Zs(t.context, this))));
	}
}, Ds = /*#__PURE__*/ new Set(), Os = "~effect/Context/Reference", ks = "~effect/Context", As = 8, js = 8, Ms = (e, t, n, r) => {
	let i = Object.create(zs);
	return i.cacheRoot = e ?? i, i.base = t, i.overlay = n, i.depth = r, i._flat = void 0, i.baseHits = 0, i;
}, Ns = (e, t) => {
	t && (Ns(e, t.parent), e.set(t.key, t.value));
}, Ps = (e) => {
	if (e._flat) return e._flat;
	if (!e.overlay) return e._flat = e.base;
	let t = new Map(e.base);
	return Ns(t, e.overlay), e._flat = t;
}, Fs = (e, t) => {
	let n = new Map(e.mapUnsafe);
	return t(n), Rs(n);
}, Is = /*#__PURE__*/ Symbol(), Ls = (e, t) => {
	let n = e;
	for (let e = n.overlay; e; e = e.parent) if (e.key === t) return e.value;
	let r = n.base.get(t);
	return r === void 0 && !n.base.has(t) ? Is : (n.overlay && ++n.baseHits >= n.base.size && n.baseHits >= js && (n.base = Ps(n), n.overlay = void 0, n.depth = 0), r);
}, Rs = (e) => Ms(void 0, e, void 0, 0), zs = {
	get mapUnsafe() {
		return Ps(this);
	},
	...oo,
	[ks]: { _Services: (e) => e },
	toJSON() {
		return {
			_id: "Context",
			services: Array.from(this.mapUnsafe).map(([e, t]) => ({
				key: e,
				value: t
			}))
		};
	},
	[fa](e) {
		if (!Vs(e)) return !1;
		let t = this.mapUnsafe, n = e.mapUnsafe;
		if (t.size !== n.size) return !1;
		for (let [e, r] of t) if (!n.has(e) || !pa(r, n.get(e))) return !1;
		return !0;
	},
	[Ji]() {
		return ea(this.mapUnsafe.size);
	}
}, Bs = (e, t) => e.cacheRoot === t.cacheRoot, Vs = (e) => R(e, ks), Hs = (e) => !!e[Os], Us = () => Ws, Ws = /*#__PURE__*/ Rs(/*#__PURE__*/ new Map()), Gs = (e, t) => Rs(/* @__PURE__ */ new Map([[e.key, t]])), Ks = /*#__PURE__*/ I(3, (e, t, n) => qs(e, t.key, n)), qs = (e, t, n) => {
	let r = e, i = Ds.has(t) ? void 0 : r.cacheRoot;
	if (r.depth >= As) {
		let e = new Map(r.mapUnsafe);
		return e.set(t, n), Ms(i, e, void 0, 0);
	}
	return Ms(i, r.base, {
		key: t,
		value: n,
		parent: r.overlay
	}, r.depth + 1);
}, Js = /*#__PURE__*/ I(2, (e, t) => Ys(e, t.key)), Ys = (e, t) => {
	let n = Ls(e, t);
	return n === Is ? void 0 : n;
}, Xs = /*#__PURE__*/ I(2, (e, t) => {
	let n = Ls(e, t.key);
	if (n === Is) {
		if (Hs(t)) return $s(t);
		throw ec(t);
	}
	return n;
}), Zs = Xs, Qs = "~effect/Context/defaultValue", $s = (e) => Qs in e ? e[Qs] : e[Qs] = e.defaultValue(), ec = (e) => {
	let t = /* @__PURE__ */ Error(`Service not found${e.key ? `: ${String(e.key)}` : ""}`);
	if (t.stack) {
		let e = t.stack.split("\n");
		e.splice(1, 3), t.stack = e.join("\n");
	}
	return t;
}, tc = /*#__PURE__*/ I(2, (e, t) => e.mapUnsafe.size === 0 ? t : t.mapUnsafe.size === 0 ? e : Fs(e, (e) => t.mapUnsafe.forEach((t, n) => e.set(n, t)))), nc = (...e) => {
	let t = /* @__PURE__ */ new Map();
	for (let n = 0; n < e.length; n++) e[n].mapUnsafe.forEach((e, n) => {
		t.set(n, e);
	});
	return Rs(t);
}, rc = Ts, ic = (e) => e.length > 0, ac = (e) => e > 0 ? Math.floor(e) : 0, oc = ps, sc = ds, cc = (e) => {
	if (Ui(e)) try {
		return oc(e());
	} catch (e) {
		return sc(e);
	}
	try {
		return oc(e.try());
	} catch (t) {
		return sc(e.catch(t));
	}
}, lc = cs, uc = /*#__PURE__*/ I(2, (e, t) => lc(e) ? t(e.failure) : e.success), dc = /*#__PURE__*/ uc(Ai), fc = globalThis.Array, pc = (e) => fc.isArray(e) ? e : fc.from(e), mc = /*#__PURE__*/ I(2, (e, t) => [...e, t]);
fc.isArray;
var hc = ic, gc = ic, _c = (e) => e[e.length - 1], vc = () => [], yc = (e) => [e], bc = /*#__PURE__*/ I(2, (e, t) => e.map(t)), xc = "~effect/Duration", Sc = /*#__PURE__*/ BigInt(0), Cc = /*#__PURE__*/ BigInt(1), wc = /*#__PURE__*/ BigInt(2), Tc = /*#__PURE__*/ BigInt(10), Ec = /*#__PURE__*/ BigInt(1e3), Dc = (e) => BigInt(e < 0 ? Math.ceil(e - .5) : Math.floor(e + .5)), Oc = (e) => Dc(e * 1e6), kc = (e, t) => {
	let n = e.indexOf(".");
	if (n === -1) return BigInt(e) * t;
	let r = e[0] === "-", i = e.slice(n + 1), a = Tc ** BigInt(i.length), o = (BigInt(e.slice(+!!r, n)) * a + BigInt(i)) * t, s = o / a + (o % a * wc >= a ? Cc : Sc);
	return r ? -s : s;
}, Ac = /^(-?\d+(?:\.\d+)?)\s+(nanos?|micros?|millis?|seconds?|minutes?|hours?|days?|weeks?)$/, jc = (e) => {
	switch (typeof e) {
		case "number": return Uc(e);
		case "bigint": return Hc(e);
		case "string": {
			if (e === "Infinity") return Bc;
			if (e === "-Infinity") return Vc;
			let t = Ac.exec(e);
			if (!t) break;
			let [n, r, i] = t;
			if (i === "nano" || i === "nanos") return Hc(kc(r, Cc));
			if (i === "micro" || i === "micros") return Hc(kc(r, Ec));
			let a = Number(r);
			switch (i) {
				case "milli":
				case "millis": return Uc(a);
				case "second":
				case "seconds": return Wc(a);
				case "minute":
				case "minutes": return Gc(a);
				case "hour":
				case "hours": return Kc(a);
				case "day":
				case "days": return qc(a);
				case "week":
				case "weeks": return Jc(a);
			}
			break;
		}
		case "object": {
			if (e === null) break;
			if (xc in e) return e;
			if (Array.isArray(e)) return e.length !== 2 || !e.every(Bi) ? Mc(e) : Number.isNaN(e[0]) || Number.isNaN(e[1]) ? zc : e[0] === -Infinity || e[1] === -Infinity ? Vc : e[0] === Infinity || e[1] === Infinity ? Bc : Lc(Dc(e[0] * 1e9 + e[1]));
			let t = e, n = 0;
			return t.weeks && (n += t.weeks * 6048e5), t.days && (n += t.days * 864e5), t.hours && (n += t.hours * 36e5), t.minutes && (n += t.minutes * 6e4), t.seconds && (n += t.seconds * 1e3), t.milliseconds && (n += t.milliseconds), !t.microseconds && !t.nanoseconds ? Lc(n) : Lc(Dc(n * 1e6 + (t.microseconds ?? 0) * 1e3 + (t.nanoseconds ?? 0)));
		}
	}
	return Mc(e);
}, Mc = (e) => {
	throw Error(`Invalid Input: ${e}`);
}, Nc = {
	_tag: "Millis",
	millis: 0
}, Pc = { _tag: "Infinity" }, Fc = { _tag: "NegativeInfinity" }, Ic = {
	[xc]: xc,
	[Ji]() {
		switch (this.value._tag) {
			case "Millis": {
				let e = this.value.millis * 1e6;
				return Number.isFinite(e) ? z(Dc(e)) : ea(this.value.millis);
			}
			case "Nanos": return z(this.value.nanos);
			default: return ra(this.value);
		}
	},
	[fa](e) {
		return Rc(e) && el(this, e);
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
	[Ha]() {
		return this.toJSON();
	},
	pipe() {
		return wi(this, arguments);
	}
}, Lc = (e) => {
	let t = Object.create(Ic);
	return t.value = typeof e == "number" ? isNaN(e) || e === 0 || Object.is(e, -0) ? Nc : Number.isFinite(e) ? Number.isInteger(e) ? {
		_tag: "Millis",
		millis: e
	} : {
		_tag: "Nanos",
		nanos: Oc(e)
	} : e > 0 ? Pc : Fc : e === Sc ? Nc : {
		_tag: "Nanos",
		nanos: e
	}, t;
}, Rc = (e) => R(e, xc), zc = /*#__PURE__*/ Lc(0), Bc = /*#__PURE__*/ Lc(Infinity), Vc = /*#__PURE__*/ Lc(-Infinity), Hc = (e) => Lc(e), Uc = (e) => Lc(e), Wc = (e) => Lc(e * 1e3), Gc = (e) => Lc(e * 6e4), Kc = (e) => Lc(e * 36e5), qc = (e) => Lc(e * 864e5), Jc = (e) => Lc(e * 6048e5), Yc = (e) => Zc(jc(e), {
	onMillis: L,
	onNanos: (e) => Number(e) / 1e6,
	onInfinity: () => Infinity,
	onNegativeInfinity: () => -Infinity
}), Xc = (e) => {
	let t = jc(e);
	switch (t.value._tag) {
		case "Infinity":
		case "NegativeInfinity": throw Error("Cannot convert infinite duration to nanos");
		case "Nanos": return t.value.nanos;
		case "Millis": return Oc(t.value.millis);
	}
}, Zc = /*#__PURE__*/ I(2, (e, t) => {
	switch (e.value._tag) {
		case "Millis": return t.onMillis(e.value.millis);
		case "Nanos": return t.onNanos(e.value.nanos);
		case "Infinity": return t.onInfinity();
		case "NegativeInfinity": return (t.onNegativeInfinity ?? t.onInfinity)();
	}
}), Qc = /*#__PURE__*/ I(3, (e, t, n) => e.value._tag === "Infinity" || e.value._tag === "NegativeInfinity" || t.value._tag === "Infinity" || t.value._tag === "NegativeInfinity" ? n.onInfinity(e, t) : e.value._tag === "Millis" ? t.value._tag === "Millis" ? n.onMillis(e.value.millis, t.value.millis) : n.onNanos(Xc(e), t.value.nanos) : n.onNanos(e.value.nanos, Xc(t))), $c = (e, t) => Qc(e, t, {
	onMillis: (e, t) => e === t,
	onNanos: (e, t) => e === t,
	onInfinity: (e, t) => e.value._tag === t.value._tag
}), el = /*#__PURE__*/ I(2, (e, t) => $c(e, t)), tl = /*#__PURE__*/ rc("effect/Scheduler", {
	fiberCached: !0,
	defaultValue: () => new ol()
}), nl = (e) => {
	let t = !1;
	return Promise.resolve().then(() => {
		t || e();
	}), () => {
		t = !0;
	};
}, rl = "setImmediate" in globalThis ? (e) => {
	let t = globalThis.setImmediate(e);
	return () => globalThis.clearImmediate(t);
} : (e) => {
	let t = setTimeout(e, 0);
	return () => clearTimeout(t);
}, il = (e) => {
	try {
		return rl(e);
	} catch {
		return nl(e);
	}
}, al = class {
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
}, ol = class {
	executionMode;
	setImmediate;
	constructor(e = "async", t) {
		this.executionMode = e, this.setImmediate = t ?? (e === "sync" ? nl : il);
	}
	shouldYield(e) {
		return e.currentOpCount >= e.cache.maxOpsBeforeYield;
	}
	makeDispatcher() {
		return new sl(this.setImmediate);
	}
}, sl = class {
	tasks = /*#__PURE__*/ new al();
	running = void 0;
	setImmediate;
	constructor(e = il) {
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
}, cl = /*#__PURE__*/ rc("effect/Scheduler/MaxOpsBeforeYield", {
	fiberCached: !0,
	defaultValue: () => 2048
}), ll = /*#__PURE__*/ rc("effect/Scheduler/PreventSchedulerYield", {
	fiberCached: !0,
	defaultValue: () => !1
}), ul = Ro, dl = (e) => {
	switch (e) {
		case 16: return ml();
		case 32: return hl();
		default: {
			let t = "";
			for (let n = e >>> 3; n > 0; n--) t += pl();
			return t;
		}
	}
}, W = /*#__PURE__*/ Uint8Array.from("0123456789abcdef", (e) => e.charCodeAt(0)), fl = () => Math.random() * 4294967296 >>> 0, pl = () => {
	let e = fl();
	return String.fromCharCode(W[e >>> 28], W[e >>> 24 & 15], W[e >>> 20 & 15], W[e >>> 16 & 15], W[e >>> 12 & 15], W[e >>> 8 & 15], W[e >>> 4 & 15], W[e & 15]);
}, ml = () => {
	let e = fl(), t = fl();
	return String.fromCharCode(W[e >>> 28], W[e >>> 24 & 15], W[e >>> 20 & 15], W[e >>> 16 & 15], W[e >>> 12 & 15], W[e >>> 8 & 15], W[e >>> 4 & 15], W[e & 15], W[t >>> 28], W[t >>> 24 & 15], W[t >>> 20 & 15], W[t >>> 16 & 15], W[t >>> 12 & 15], W[t >>> 8 & 15], W[t >>> 4 & 15], W[t & 15]);
}, hl = () => {
	let e = fl(), t = fl(), n = fl(), r = fl();
	return String.fromCharCode(W[e >>> 28], W[e >>> 24 & 15], W[e >>> 20 & 15], W[e >>> 16 & 15], W[e >>> 12 & 15], W[e >>> 8 & 15], W[e >>> 4 & 15], W[e & 15], W[t >>> 28], W[t >>> 24 & 15], W[t >>> 20 & 15], W[t >>> 16 & 15], W[t >>> 12 & 15], W[t >>> 8 & 15], W[t >>> 4 & 15], W[t & 15], W[n >>> 28], W[n >>> 24 & 15], W[n >>> 20 & 15], W[n >>> 16 & 15], W[n >>> 12 & 15], W[n >>> 8 & 15], W[n >>> 4 & 15], W[n & 15], W[r >>> 28], W[r >>> 24 & 15], W[r >>> 20 & 15], W[r >>> 16 & 15], W[r >>> 12 & 15], W[r >>> 8 & 15], W[r >>> 4 & 15], W[r & 15]);
}, gl = "effect/Tracer/ParentSpan", _l = class extends (/*#__PURE__*/ Ts()(gl, { fiberCached: !0 })) {}, vl = (e) => e, yl = /*#__PURE__*/ rc("effect/Tracer/DisablePropagation", { defaultValue: ki }), bl = /*#__PURE__*/ rc("effect/Tracer/CurrentTraceLevel", { defaultValue: () => "Info" }), xl = /*#__PURE__*/ rc("effect/Tracer/MinimumTraceLevel", { defaultValue: () => "All" }), Sl = "effect/Tracer", Cl = /*#__PURE__*/ vl({ span: (e) => new wl(e) }), wl = class {
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
		return this._traceId ??= Cs(this.parent)?.traceId ?? dl(32);
	}
	get spanId() {
		return this._spanId ??= dl(16);
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
}, Tl = "effect/Metric/FiberRuntimeMetrics", El = /*#__PURE__*/ rc("effect/References/CurrentStackFrame", {
	fiberCached: !0,
	defaultValue: Ai
}), Dl = /*#__PURE__*/ rc("effect/References/TracerEnabled", {
	fiberCached: !0,
	defaultValue: Oi
}), Ol = /*#__PURE__*/ rc("effect/References/TracerTimingEnabled", { defaultValue: Oi }), kl = /*#__PURE__*/ rc("effect/References/TracerSpanAnnotations", { defaultValue: () => ({}) }), Al = /*#__PURE__*/ rc("effect/References/TracerSpanLinks", { defaultValue: () => [] }), jl = /*#__PURE__*/ rc("effect/References/CurrentLogLevel", {
	fiberCached: !0,
	defaultValue: () => "Info"
}), Ml = /*#__PURE__*/ rc("effect/References/MinimumLogLevel", {
	fiberCached: !0,
	defaultValue: () => "Info"
}), Nl = (e) => (t) => {
	let n;
	return () => {
		if (n !== void 0) return n;
		let r = t();
		if (!r) return;
		let i = r.split("\n");
		if (i[e] !== void 0) return n = i[e].trim(), n;
	};
}, Pl = class extends go {
	constructor(e, t = _o) {
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
	[fa](e) {
		return Eo(e) && this.fiberId === e.fiberId && this.annotations === e.annotations;
	}
	[Ji]() {
		return Zi(ta(`${this._tag}:${this.fiberId}`))(Yi(this.annotations));
	}
}, Fl = (e) => new mo([new Pl(e)]), Il = (e) => {
	for (let t = 0; t < e.reasons.length; t++) {
		let n = e.reasons[t];
		if (n._tag === "Fail") return oc(n.error);
	}
	return sc(e);
}, Ll = (e) => e.reasons.some(Eo), Rl = (e) => {
	let t;
	for (let n = 0; n < e.reasons.length; n++) {
		let r = e.reasons[n];
		r._tag === "Interrupt" && (t ??= /* @__PURE__ */ new Set(), r.fiberId !== void 0 && t.add(r.fiberId));
	}
	return t ? oc(t) : sc(e);
}, zl = (e, t) => {
	let n = /* @__PURE__ */ new Map(), r = [];
	for (let i of e.concat(t)) {
		let e = z(i), t = n.get(e);
		if (t === void 0) n.set(e, [i]);
		else if (t.some((e) => pa(e, i))) continue;
		else t.push(i);
		r.push(i);
	}
	return r;
}, Bl = /*#__PURE__*/ I(2, (e, t) => {
	if (e.reasons.length === 0) return t;
	if (t.reasons.length === 0) return e;
	let n = new mo(zl(e.reasons, t.reasons));
	return pa(e, n) ? e : n;
}), Vl = /*#__PURE__*/ I(2, (e, t) => {
	let n = !1, r = e.reasons.map((e) => wo(e) ? (n = !0, new vo(t(e.error), e.annotations)) : e);
	return n ? yo(r) : e;
}), Hl = (e) => {
	let t;
	for (let n of e.reasons) {
		if (n._tag === "Fail") return n.error;
		n._tag === "Die" && (t ??= n);
	}
	return t === void 0 ? e.reasons.length > 0 ? new globalThis.Error("All fibers interrupted without error") : new globalThis.Error("Empty cause") : t.defect;
}, Ul = "~effect/Fiber", Wl = {
	_A: L,
	_E: L
}, Gl = { id: 0 }, Kl = () => globalThis[Ma], ql = class {
	constructor(e, t = !0) {
		this.setContext(e), this.id = ++Gl.id, this.currentOpCount = 0, this.interruptible = t, this._stack = [], this._observers = void 0, this._exit = void 0, this._children = void 0, this._interruptedCause = void 0, this._yielded = void 0, this._running = !1, this._deferredInterrupt = !1, this._parent = void 0, this.cache.runtimeMetrics?.recordFiberStart(this.context);
	}
	get [Ul]() {
		return Wl;
	}
	get currentDispatcher() {
		return this._dispatcher ??= this.cache.scheduler.makeDispatcher();
	}
	getRef(e) {
		return Zs(this.context, e);
	}
	addObserver(e) {
		return this._exit ? (e(this._exit), ji) : (this._observers === void 0 ? this._observers = [e] : this._observers.push(e), () => this.removeObserver(e));
	}
	removeObserver(e) {
		if (this._exit || this._observers === void 0) return;
		let t = this._observers.indexOf(e);
		t >= 0 && this._observers.splice(t, 1);
	}
	interruptUnsafe(e, t) {
		if (this._exit) return;
		let n = Fl(e);
		this.cache.stackFrame && (n = Co(n, Gs(jo, this.cache.stackFrame))), t && (n = Co(n, t)), this._interruptedCause = this._interruptedCause ? Bl(this._interruptedCause, n) : n, this.interruptible && (this._running ? this._deferredInterrupt = !0 : this.evaluate(au(this._interruptedCause)));
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
		if (t === ao) return;
		let n = Zl.interruptChildren && Zl.interruptChildren(this);
		if (n !== void 0) return this.evaluate(Uu(n, () => t));
		if (this._exit = t, this.cache.runtimeMetrics?.recordFiberEnd(this.context, this._exit), this._parent &&= (this._parent._children?.delete(this), void 0), this._observers !== void 0) {
			let e = this._observers;
			this._observers = void 0;
			for (let n = 0; n < e.length; n++) e[n](t);
		}
		this._stack.length = 0, this._children = void 0, this.context = Us();
	}
	runLoop(e) {
		let t = globalThis[Ma];
		globalThis[Ma] = this;
		let n = this._running;
		this._running = !0;
		let r = !1, i = e;
		this.currentOpCount = 0;
		try {
			for (;;) {
				this._deferredInterrupt && (this._deferredInterrupt = !1, i = au(this._interruptedCause)), this.currentOpCount++;
				let e = this.cache;
				if (!r && !e.preventYield && e.scheduler.shouldYield(this)) {
					r = !0;
					let e = i;
					i = Uu(su, () => e);
				}
				if (i = e.tracerContext ? e.tracerContext(i, this) : i[V](this), i === ao) {
					let e = this._yielded;
					if ($a in e) return this._deferredInterrupt = !1, this._yielded = void 0, e;
					if (this._deferredInterrupt) {
						this._yielded = void 0, e();
						continue;
					}
					return ao;
				}
			}
		} catch (e) {
			return R(i, V) ? this.runLoop(Fo(e)) : Fo(`Fiber.runLoop: Not a valid effect: ${String(i)}`);
		} finally {
			this._running = n, globalThis[Ma] = t;
		}
	}
	getCont(e) {
		if (this._deferredInterrupt) return this._deferredInterrupt = !1, Yl;
		for (;;) {
			let t = this._stack.pop();
			if (!t) return;
			let n = t[io];
			if (n !== void 0) {
				let r = n.call(t, this);
				if (r) return r[e] = r, r;
			}
			if (t[e]) return t;
		}
	}
	succeedWith(e) {
		if (!(++this.currentOpCount & Xl - 1)) return H(e);
		let t = this.getCont(no);
		return t ? t[no](e, this) : this.yieldWith(H(e));
	}
	yieldWith(e) {
		return this._yielded = e, ao;
	}
	children() {
		return this._children ??= /* @__PURE__ */ new Set();
	}
	pipe() {
		return wi(this, arguments);
	}
	setContext(e) {
		let t = this.context;
		if (this.context = e, t !== void 0 && Bs(t, e)) return;
		let n = e.cacheRoot, r = n._fiberCache ??= Jl(e);
		this.cache?.scheduler !== r.scheduler && (this._dispatcher = void 0), this.cache = r;
	}
	get currentSpanLocal() {
		let e = this.cache.span;
		return e?._tag === "Span" ? e : void 0;
	}
}, Jl = (e) => {
	let t = Ys(e, Sl);
	return {
		scheduler: Zs(e, tl),
		tracer: t,
		tracerContext: t ? t.context : void 0,
		tracerEnabled: Zs(e, Dl),
		span: Ys(e, gl),
		logLevel: Zs(e, jl),
		minimumLogLevel: Zs(e, Ml),
		stackFrame: Zs(e, El),
		runtimeMetrics: Ys(e, Tl),
		maxOpsBeforeYield: Zs(e, cl),
		preventYield: Zs(e, ll)
	};
}, Yl = {
	[no](e, t) {
		return au(t._interruptedCause);
	},
	[ro](e, t) {
		return au(t._interruptedCause);
	}
}, Xl = 32, Zl = { interruptChildren: void 0 }, Ql = (e) => {
	if (!e.cache.stackFrame) return;
	let t = /* @__PURE__ */ new Map();
	return t.set(Mo.key, e.cache.stackFrame), Rs(t);
}, $l = (e) => {
	let t = e;
	return t._exit ? G(t._exit) : hu((n) => t._exit ? n(G(t._exit)) : K(e.addObserver((e) => n(G(e)))));
}, eu = (e) => hu((t) => {
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
		t(G(r));
	}
	return a(), K(() => i?.());
}), tu = (e) => {
	let t = e;
	return t._exit ? t._exit : hu((n) => t._exit ? n(t._exit) : K(e.addObserver(n)));
}, nu = (e) => U((t) => ru(e, t.id)), ru = /*#__PURE__*/ I((e) => R(e[0], Ul), (e, t, n) => U((r) => {
	let i = Ql(r);
	return i = i && n ? tc(i, n) : i ?? n, e.interruptUnsafe(t, i), Bu($l(e));
})), iu = (e) => U((t) => {
	let n = Ql(t), r = vc();
	for (let i of e) i.interruptUnsafe(t.id, n), r.push(i);
	return Bu(eu(r));
}), G = H, au = No, ou = Po, K = /*#__PURE__*/ ko({
	op: "Sync",
	[V](e) {
		let t = this[B](), n = e.getCont(no);
		return n ? n[no](t, e) : e.yieldWith(H(t));
	}
}), q = /*#__PURE__*/ ko({
	op: "Suspend",
	[V](e) {
		return this[B]();
	}
}), su = /*#__PURE__*/ (/* @__PURE__ */ ko({
	op: "Yield",
	[V](e) {
		let t = !1;
		return e.currentDispatcher.scheduleTask(() => {
			t || e.evaluate(Zu);
		}, this[B] ?? 0), e.yieldWith(() => {
			t = !0;
		});
	}
}))(0), cu = /*#__PURE__*/ G(/*#__PURE__*/ ys()), lu = (e) => q(() => au(e())), uu = (e) => Fo(e), du = (e) => q(() => ou(e())), J = /*#__PURE__*/ G(void 0), fu = (e) => U((t) => e(t.id)), pu = /*#__PURE__*/ function() {
	let e = /*#__PURE__*/ Oo({
		op: "Async",
		[V](e) {
			let t = !1, n = !1, r = this.withSignal ? new AbortController() : void 0, i = this.register.call(e.cache.scheduler, (r) => {
				t || (t = !0, n ? e.evaluate(r) : n = r);
			}, r?.signal);
			return n === !1 ? (n = !0, e._yielded = () => {
				t = !0;
			}, r === void 0 && i === void 0 || e._stack.push(mu(() => (t = !0, r?.abort(), i ?? Zu))), ao) : n;
		}
	}), t = function(e, t) {
		this.register = e, this.withSignal = t;
	};
	return t.prototype = e, function(e, n) {
		return new t(e, n);
	};
}(), mu = /*#__PURE__*/ ko({
	op: "AsyncFinalizer",
	[io](e) {
		e.interruptible && (e.interruptible = !1, e._stack.push($d));
	},
	[ro](e, t) {
		return Ll(e) ? Uu(Ad(No(e), this[B]()), () => au(e)) : au(e);
	}
}), hu = (e) => pu(e, e.length >= 2), gu = /*#__PURE__*/ hu(ji), _u = (...e) => {
	if (e.length === 1) {
		let t = e[0];
		return q(() => Tu(t()));
	}
	let [t, n] = e;
	return q(() => Tu(n.call(t.self)));
}, vu = (e, ...t) => {
	let n = t.length === 0 ? function() {
		return q(() => Tu(e.apply(this, arguments)));
	} : function() {
		let n = q(() => Tu(e.apply(this, arguments)));
		for (let e = 0; e < t.length; e++) n = t[e](n, ...arguments);
		return n;
	};
	return yu(e.length, n);
}, yu = (e, t) => Object.defineProperty(t, "length", {
	value: e,
	configurable: !0
}), bu = /*#__PURE__*/ Nl(2), xu = function() {
	let e = typeof arguments[0] == "string", t = e ? arguments[0] : "Effect.fn", n = e ? arguments[1] : void 0, r = Ka(), i;
	return r !== 0 && (qa(2), i = new globalThis.Error(), qa(r)), e ? (r, ...a) => Su(t, r, i, a, e, n) : Su(t, arguments[0], i, Array.prototype.slice.call(arguments, 1), e, n);
}, Su = (e, t, n, r, i, a) => {
	let o = typeof t == "function" ? t : r.shift().bind(t.self), s = `${e} (definition)`, c = n ? bu(() => n.stack) : Ai;
	return yu(o.length, function(...t) {
		let n = q(() => {
			let e = o.apply(this, arguments);
			return co(e) ? e : Tu(e);
		});
		for (let e = 0; e < r.length; e++) n = r[e](n, ...t);
		if (!co(n)) return n;
		let l = Ka(), u;
		return l !== 0 && (qa(2), u = new globalThis.Error(), qa(l)), nd(i ? Nf(e, a, (e) => Pf(n, e)) : n, El, (t) => ({
			name: e,
			stack: u ? bu(() => u.stack) : Ai,
			parent: {
				name: s,
				stack: c,
				parent: t
			}
		}));
	});
}, Cu = (e, ...t) => yu(e.length, t.length === 0 ? function() {
	return wu(() => e.apply(this, arguments));
} : function() {
	let n = wu(() => e.apply(this, arguments));
	for (let e of t) n = e(n, ...arguments);
	return n;
}), wu = (e) => {
	try {
		let t = e(), n;
		for (;;) {
			let r = t.next(n);
			if (r.done) return G(r.value);
			let i = r.value;
			if (i && i._tag === "Success") {
				n = i.value;
				continue;
			}
			if (i && i._tag === "Failure") return r.value;
			{
				let n = !0;
				return q(() => n ? (n = !1, Uu(r.value, (e) => Tu(t, e))) : q(() => Tu(e())));
			}
		}
	} catch (e) {
		return uu(e);
	}
}, Tu = /*#__PURE__*/ function() {
	let e = /*#__PURE__*/ Oo({
		op: "Iterator",
		[no](e, t) {
			let n = this.iterator;
			for (;;) {
				let r = n.next(e);
				if (r.done) return G(r.value);
				if (!Y(r.value)) return t._stack.push(this), r.value;
				if (r.value._tag === "Failure") return r.value;
				e = r.value.value;
			}
		},
		[V](e) {
			return this[no](this.initial, e);
		}
	}), t = function(e, t) {
		this.iterator = e, this.initial = t;
	};
	return t.prototype = e, function(e, n) {
		return new t(e, n);
	};
}(), Eu = /*#__PURE__*/ I(2, (e, t) => new ku(e, Au, G(t))), Du = function(e) {
	return e._stack.push(this), this[B];
}, Ou = /*#__PURE__*/ Oo({
	op: "OnSuccess",
	[V]: Du
}), ku = function(e, t, n) {
	this[B] = e, this[no] = t, this.payload = n;
};
ku.prototype = Ou;
var Au = function() {
	return this.payload;
}, ju = function(e, t) {
	return t.succeedWith(this.payload);
}, Mu = /*#__PURE__*/ (() => {
	let e = "~effect/Effect/stackProbe";
	return { [e]: function() {
		return (/* @__PURE__ */ Error()).stack;
	} }[e]()?.includes("[as " + e + "]") === !0;
})(), Nu = function(e, t) {
	let n = this.payload;
	return t.succeedWith(Mu ? n(e) : Ya(() => n(e)));
}, Pu = function(e) {
	let t = this.payload;
	return t(e);
}, Fu = function(e) {
	let t = this.payload;
	return new ku(t(e), ju, e);
}, Iu = function(e) {
	return new ku(this.payload, ju, e);
}, Lu = (e) => Ku(e, bs), Ru = /*#__PURE__*/ I(2, (e, t) => new ku(e, co(t) ? Au : Pu, t)), zu = /*#__PURE__*/ I(2, (e, t) => new ku(e, co(t) ? Iu : Fu, t)), Bu = (e) => new ku(e, Au, Zu), Vu = (e, t) => U((n) => {
	let r = /* @__PURE__ */ new Set();
	return Wd(n, () => r.size === 0 ? void 0 : iu(r)), hu((i) => {
		let a = !1, o = 0;
		for (let s of e) {
			if (a) break;
			let e = o++, c = mf(n, s, !0, !0, !1);
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
}), Hu = /*#__PURE__*/ I((e) => co(e[1]), (e, t, n) => Vu([e, t], n)), Uu = /*#__PURE__*/ I(2, (e, t) => new ku(e, Pu, t)), Y = (e) => e[$a] !== void 0, Wu = /*#__PURE__*/ I(2, (e, t) => Y(e) ? e._tag === "Success" ? t(e.value) : e : Uu(e, t)), Gu = (e) => Uu(e, L), Ku = /*#__PURE__*/ I(2, (e, t) => new ku(e, Nu, t)), qu = /*#__PURE__*/ I(2, (e, t) => Y(e) ? Qu(e, t) : Ku(e, t)), Ju = (e) => No(Fl(e)), Yu = (e) => e._tag === "Success", Xu = (e) => e._tag === "Failure" ? oc(e.cause) : sc(e), Zu = /*#__PURE__*/ H(void 0), Qu = /*#__PURE__*/ I(2, (e, t) => e._tag === "Success" ? H(t(e.value)) : e), $u = /*#__PURE__*/ I(2, (e, t) => Yu(e) ? t : e), ed = (e) => {
	let t = [];
	for (let n of e) n._tag === "Failure" && t.push(...n.cause.reasons);
	return t.length === 0 ? Zu : No(yo(t));
}, td = /*#__PURE__*/ I(2, (e, t) => U((n) => {
	let r = n.context, i = t(r);
	return r === i ? e : (n.setContext(i), Wd(n, () => {
		n.setContext(r);
	}), e);
})), nd = /*#__PURE__*/ I(3, (e, t, n) => td(e, (e) => {
	let r = Xs(e, t), i = n(r);
	return r === i ? e : Ks(e, t, i);
})), rd = () => id, id = /*#__PURE__*/ U((e) => G(e.context)), ad = (e) => U((t) => e(t.context)), od = /*#__PURE__*/ I(2, (e, t) => Y(e) ? e : td(e, tc(t))), sd = function() {
	return arguments.length === 1 ? I(2, (e, t) => cd(e, arguments[0], t)) : I(3, (e, t, n) => cd(e, t, n)).apply(this, arguments);
}, cd = (e, t, n) => td(e, Ks(t, n)), ld = /*#__PURE__*/ I(2, (e, t) => Uu(t, (t) => t ? Lu(e) : cu)), ud = /*#__PURE__*/ I((e) => co(e[0]), (e, t) => of({
	while: Oi,
	body: Di(t?.disableYield ? e : Uu(e, (e) => su)),
	step: ji
})), dd = /*#__PURE__*/ I(2, (e, t) => new pd(e, t.length === 1 ? t : (e) => t(e))), fd = /*#__PURE__*/ Oo({
	op: "OnFailure",
	[V]: Du
}), pd = function(e, t) {
	this[B] = e, this[ro] = t;
};
pd.prototype = fd;
var md = /*#__PURE__*/ I(3, (e, t, n) => dd(e, (e) => {
	let r = t(e);
	return lc(r) ? au(r.failure) : n(r.success, e);
})), hd = /*#__PURE__*/ I(2, (e, t) => md(e, Il, (e) => t(e))), gd = /*#__PURE__*/ I((e) => co(e[0]), (e, t, n, r) => dd(e, (e) => {
	let i = Il(e);
	return lc(i) ? au(i.failure) : t(i.success) ? n(i.success) : r ? r(i.success) : au(e);
})), _d = /*#__PURE__*/ I((e) => co(e[0]), (e, t, n, r) => gd(e, Array.isArray(t) ? (e) => R(e, "_tag") && t.includes(e._tag) : qi(t), n, r)), vd = /*#__PURE__*/ I(2, (e, t) => hd(e, (e) => du(() => t(e)))), yd = /*#__PURE__*/ I(2, (e, t) => new xd(e, t.onSuccess.length === 1 ? t.onSuccess : (e) => t.onSuccess(e), t.onFailure.length === 1 ? t.onFailure : (e) => t.onFailure(e))), bd = /*#__PURE__*/ Oo({
	op: "OnSuccessAndFailure",
	[V]: Du
}), xd = function(e, t, n) {
	this[B] = e, this[no] = t, this[ro] = n;
};
xd.prototype = bd;
var Sd = (e) => Y(e) ? H(e) : Cd(e), Cd = /*#__PURE__*/ ko({
	op: "Exit",
	[V](e) {
		return e._stack.push(this), this[B];
	},
	[no](e, t, n) {
		return t.succeedWith(n ?? H(e));
	},
	[ro](e, t, n) {
		return t.succeedWith(n ?? No(e));
	}
}), wd = "~effect/Scope", Td = "~effect/Scope/Closeable", Ed = /*#__PURE__*/ Ts("effect/Scope"), Dd = (e, t) => U((n) => {
	let r = Od(e, t);
	return r === void 0 ? J : (nf(n), r);
}), Od = (e, t) => {
	let n = e.state;
	if (n._tag === "Closed" || (e.state = {
		_tag: "Closed",
		exit: t
	}, e.parent !== void 0 && Id(e.parent, e), n._tag === "Empty")) return;
	if (n.finalizer !== void 0) return kd(n.finalizer, t);
	let r = n.finalizers;
	return r.size === 1 ? kd(r.values().next().value, t) : jd(e, r, t);
}, kd = (e, t) => {
	try {
		return e(t);
	} catch (e) {
		return Fo(e);
	}
}, Ad = (e, t) => Yu(e) ? t : dd(t, (t) => au(Bl(e.cause, t))), jd = /*#__PURE__*/ vu(function* (e, t, n) {
	let r = [], i = [], a = Array.from(t.values()), o = Kl();
	for (let t = a.length - 1; t >= 0; t--) {
		let s = a[t];
		e.strategy === "sequential" ? r.push(yield* Sd(kd(s, n))) : i.push(mf(o, kd(s, n), !0, !0, "inherit"));
	}
	return i.length > 0 && (r = yield* eu(i)), yield* ed(r);
}), Md = (e, t) => {
	let n = Rd(t, e);
	return e.state._tag === "Closed" ? (n.state = e.state, n) : (Fd(e, n, (e) => Dd(n, e)), n);
}, Nd = (e, t) => q(() => e.state._tag === "Closed" ? t(e.state.exit) : (Fd(e, {}, t), J)), Pd = (e, t) => Nd(e, Di(t)), Fd = (e, t, n) => {
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
}, Id = (e, t) => {
	if (e.state._tag !== "Open") return;
	let n = e.state;
	n.finalizerKey === t ? e.state = zd : n.finalizers !== void 0 && (n.finalizers.delete(t), n.finalizers.size === 0 && (e.state = zd));
}, Ld = (e) => Rd(e, void 0), Rd = (e = "sequential", t) => ({
	[Td]: Td,
	[wd]: wd,
	strategy: e,
	parent: t,
	state: zd
}), zd = { _tag: "Empty" }, Bd = /*#__PURE__*/ sd(Ed), Vd = (e) => q(() => {
	let t = Ld();
	return Gd(e(t), (e) => q(() => Od(t, e) ?? J));
}), Hd = /*#__PURE__*/ function() {
	let e = /*#__PURE__*/ Oo({
		op: "OnExit",
		[V](e) {
			return e._stack.push(this), this.effect;
		},
		[io](e) {
			e.interruptible && this.interruptible !== !0 && (e._stack.push($d), e.interruptible = !1);
		},
		[no](e, t, n) {
			n ??= H(e);
			let r;
			try {
				r = this.onExit(n);
			} catch (e) {
				r = Fo(e);
			}
			return r ? Uu(r, (e) => n) : n;
		},
		[ro](e, t, n) {
			n ??= No(e);
			let r;
			try {
				r = this.onExit(n);
			} catch (e) {
				r = Fo(e);
			}
			return r ? Uu(Ad(n, r), (e) => n) : n;
		}
	}), t = function(e, t, n) {
		this.effect = e, this.onExit = t, this.interruptible = n;
	};
	return t.prototype = e, t;
}(), Ud = (e, t, n) => new Hd(e, t, n), Wd = (e, t) => {
	e._stack.push(new Hd(void 0, t, void 0));
}, Gd = /*#__PURE__*/ I(2, Ud), Kd = /*#__PURE__*/ I(3, (e, t, n) => Gd(e, (e) => {
	let r = t(e);
	return lc(r) ? J : n(r.success, e);
})), qd = /*#__PURE__*/ I(2, (e, t) => Kd(e, Xu, t)), Jd = /*#__PURE__*/ I(3, (e, t, n) => Gd(e, (e) => {
	if (e._tag !== "Failure") return J;
	let r = t(e.cause);
	return lc(r) ? J : n(r.success, e.cause);
})), Yd = /*#__PURE__*/ I(2, (e, t) => Jd(Rl, t)(e)), Xd = /*#__PURE__*/ U((e) => au(Fl(e.id))), Zd = (e) => U((t) => t.interruptible ? (t.interruptible = !1, t._stack.push($d), e) : e), Qd = /*#__PURE__*/ ko({
	op: "SetInterruptible",
	[io](e) {
		if (e.interruptible = this[B], e._interruptedCause && e.interruptible) return () => au(e._interruptedCause);
	}
}), $d = /*#__PURE__*/ Qd(!0), ef = /*#__PURE__*/ Qd(!1), tf = (e) => {
	if (e.interruptible = !0, e._stack.push(ef), e._interruptedCause) return au(e._interruptedCause);
}, nf = (e) => {
	let t = e;
	t.interruptible && (t.interruptible = !1, t._stack.push($d));
}, rf = (e) => U((t) => t.interruptible ? e : tf(t) ?? e), af = (e) => U((t) => t.interruptible ? (t.interruptible = !1, t._stack.push($d), e(rf)) : e(L)), of = /*#__PURE__*/ ko({
	op: "While",
	[no](e, t) {
		return this[B].step(e), this[B].while() ? (t._stack.push(this), this[B].body()) : Zu;
	},
	[V](e) {
		return this[B].while() ? (e._stack.push(this), this[B].body()) : Zu;
	}
}), sf = /*#__PURE__*/ I((e) => typeof e[1] == "function", (e, t, n) => q(() => {
	let r = lf(n?.concurrency);
	if (r === 1) return cf(e, t, n);
	let i = pc(e), a = i.length;
	if (a === 0) return n?.discard ? J : G([]);
	let o = n?.discard ? void 0 : Array(a), s = pf({
		f: t,
		out: o
	}, i, { concurrency: r });
	return s ? Eu(s, o) : G(o);
})), cf = (e, t, n) => q(() => {
	let r = n?.discard ? void 0 : [], i = e[Symbol.iterator](), a = i.next(), o = 0;
	return Eu(of({
		while: () => !a.done,
		body: () => t(a.value, o++),
		step: (e) => {
			r && r.push(e), a = i.next();
		}
	}), r);
}), lf = (e) => e === "unbounded" ? Infinity : Math.max(1, e ?? 1), uf = () => (e) => {
	let t = e.onItem, n = e.step, r = (e, t, r, a, o) => Uu(Sd(o), (o) => n(e, t[r], o, r) ?? i(e, t, r + 1, a) ?? J), i = (e, i, a = 0, o = i.length) => {
		for (; a < o; a++) {
			let s = i[a], c = t(e, s, a);
			if (!Y(c)) return r(e, i, a, o, c);
			let l = n(e, s, c, a);
			if (l) return l._tag === "Failure" ? l : void 0;
		}
	};
	return i;
}, df = (e) => {
	let t = e.onItem, n = e.step;
	return (e, r, i) => {
		let a = 0, o = i.end ?? r.length, s = i.concurrency, c = !1, l, u, d, f, p, m = (e) => {
			let t = Fo(e);
			return f = t, c = !0, u && u.size > 0 ? Uu(Zd(iu(Array.from(u))), () => f ?? t) : t;
		}, h = () => {
			let i = !1;
			for (; !f && a < o; a++) {
				let o = r[a], g = p ?? t(e, o, a);
				if (Y(g)) {
					if (f = n(e, o, g, a), f) break;
				} else if (l) {
					p = void 0;
					let t = mf(l, g, !0, !0, "inherit");
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
										let t = yo(e);
										f = No(f._tag === "Failure" ? Bl(f.cause, t) : t);
									}
								}
							} else {
								let t = n(e, o, a, r);
								t && (f = t, h());
							}
							if (i) {
								let e = h();
								e && d(e);
							} else c && u.size === 0 && d(f ?? J);
						} catch (e) {
							d(m(e));
						}
					}), u.size < s) continue;
					i = !0, a++;
					return;
				} else return hu((e) => {
					l = Kl(), u = /* @__PURE__ */ new Set(), p = g, d = e;
					let t;
					try {
						t = h();
					} catch (t) {
						return e(m(t));
					}
					return t ? e(t) : q(() => (f ??= Zu, Uu(u ? iu(u) : J, () => f?._tag === "Failure" ? f : J)));
				});
			}
			if (c = !0, f) {
				if (u && u.size > 0) {
					let e = Ql(l);
					u.forEach((t) => t.interruptUnsafe(l.id, e));
					return;
				}
				if (d || f._tag === "Failure") return f;
			} else if (d) {
				if (u) u.size === 0 && d(J);
				else return Zu;
			}
		};
		return h();
	};
}, ff = () => (e) => df(e), pf = /*#__PURE__*/ df({
	onItem(e, t, n) {
		return e.f(t, n);
	},
	step(e, t, n, r) {
		if (n._tag === "Failure") return n;
		e.out && (e.out[r] = n.value);
	}
}), mf = (e, t, n = !1, r = !1, i = !1) => {
	let a = e, o = i === "inherit" ? a.interruptible : !i, s = new ql(a.context, o);
	return n ? s.evaluate(t) : a.currentDispatcher.scheduleTask(() => s.evaluate(t), 0), !r && !s._exit && (a.children().add(s), s._parent = a), s;
}, hf = /*#__PURE__*/ I((e) => co(e[0]), (e, t) => U((n) => G(mf(n, e, t?.startImmediately, !0, t?.uninterruptible)))), gf = /*#__PURE__*/ I((e) => co(e[0]), (e, t, n) => U((r) => {
	let i = mf(r, e, n?.startImmediately, !0, n?.uninterruptible);
	if (!i._exit) {
		if (t.state._tag !== "Closed") {
			let e = {};
			Fd(t, e, () => fu((e) => e === i.id ? J : nu(i))), i.addObserver(() => Id(t, e));
		} else i.interruptUnsafe(r.id, Ql(r));
	}
	return G(i);
})), _f = (e) => (t, n) => {
	let r = new ql(n?.scheduler ? Ks(e, tl, n.scheduler) : e, n?.uninterruptible !== !0);
	if (r.evaluate(t), r._exit) return r;
	if (n?.signal) {
		if (n.signal.aborted) r.interruptUnsafe();
		else {
			let e = () => r.interruptUnsafe();
			n.signal.addEventListener("abort", e, { once: !0 }), r.addObserver(() => n.signal.removeEventListener("abort", e));
		}
	}
	return n?.onFiberStart && n.onFiberStart(r), r;
}, vf = /*#__PURE__*/ I(2, (e, t) => {
	if (e._exit) return e;
	if (t.state._tag === "Closed") return e.interruptUnsafe(e.id), e;
	let n = {};
	return Fd(t, n, () => nu(e)), e.addObserver(() => Id(t, n)), e;
}), yf = /*#__PURE__*/ _f(/*#__PURE__*/ Us()), bf = (e) => {
	let t = _f(e);
	return (e) => {
		if (Y(e)) return e;
		let n = new ol("sync"), r = t(e, { scheduler: n });
		return r._dispatcher?.flush(), r._exit ?? Fo(new Wf(r));
	};
}, xf = /*#__PURE__*/ bf(/*#__PURE__*/ Us()), Sf = /*#__PURE__*/ ((e) => {
	let t = bf(e);
	return (e) => {
		let n = t(e);
		if (n._tag === "Failure") throw Hl(n.cause);
		return n.value;
	};
})(/*#__PURE__*/ Us()), Cf = /*#__PURE__*/ G(!0), wf = /*#__PURE__*/ G(!1), Tf = class {
	waiters = [];
	scheduled = void 0;
	_isOpen;
	constructor(e) {
		this._isOpen = e;
	}
	scheduleUnsafe(e) {
		if (this.waiters.length === 0) return Cf;
		if (this.scheduled === void 0) this.scheduled = this.waiters, e.currentDispatcher.scheduleTask(this.flushScheduled, 0);
		else for (let e = 0; e < this.waiters.length; e++) this.scheduled.push(this.waiters[e]);
		return this.waiters = [], Cf;
	}
	flushScheduled = () => {
		if (this.scheduled === void 0) return;
		let e = this.scheduled;
		this.scheduled = void 0;
		for (let t = 0; t < e.length; t++) e[t](Zu);
	};
	flushWaiters() {
		let e = this.waiters;
		this.waiters = [], this.flushScheduled();
		for (let t = 0; t < e.length; t++) e[t](Zu);
	}
	open = /*#__PURE__*/ U((e) => this._isOpen ? wf : (this._isOpen = !0, this.scheduleUnsafe(e)));
	release = /*#__PURE__*/ U((e) => this._isOpen ? wf : this.scheduleUnsafe(e));
	openUnsafe() {
		return !this._isOpen && (this._isOpen = !0, this.flushWaiters(), !0);
	}
	await = /*#__PURE__*/ hu((e) => this._isOpen ? e(J) : (this.waiters.push(e), K(() => {
		let t = this.waiters.indexOf(e);
		t === -1 ? this.scheduled !== void 0 && (t = this.scheduled.indexOf(e), t !== -1 && this.scheduled.splice(t, 1)) : this.waiters.splice(t, 1);
	})));
	closeUnsafe() {
		return this._isOpen ? (this._isOpen = !1, !0) : !1;
	}
	close = /*#__PURE__*/ K(() => this.closeUnsafe());
	whenOpen = (e) => Uu(this.await, () => e);
	isOpen() {
		return this._isOpen;
	}
}, Ef = (e) => new Tf(e ?? !1), Df = /*#__PURE__*/ BigInt(0), Of = {
	_tag: "Span",
	spanId: "noop",
	traceId: "noop",
	sampled: !1,
	status: {
		_tag: "Ended",
		startTime: Df,
		endTime: Df,
		exit: Zu
	},
	attributes: /*#__PURE__*/ new Map(),
	links: [],
	kind: "internal",
	attribute() {},
	event() {},
	end() {},
	addLinks() {}
}, kf = (e) => Object.assign(Object.create(Of), e), Af = (e) => e ? Zs(e.annotations, yl) ? e._tag === "Span" ? Af(Cs(e.parent)) : ys() : bs(e) : ys(), jf = (e, t, n) => {
	let r = !e.cache.tracerEnabled || n?.annotations && Zs(n.annotations, yl), i = n?.parent === void 0 ? n?.root ? ys() : Af(e.cache.span) : bs(n.parent), a;
	if (r) a = kf({
		name: t,
		parent: i,
		annotations: Ks(n?.annotations ?? Us(), yl, !0)
	});
	else {
		let r = e.cache.tracer ?? Cl, o = e.getRef(Ff), s = e.getRef(Ol), c = e.getRef(kl), l = e.getRef(Al), u = n?.level ?? e.getRef(bl), d = n?.links === void 0 ? l.length === 0 ? [] : l.slice() : [...l, ...n.links];
		a = r.span({
			name: t,
			parent: i,
			annotations: n?.annotations ?? Us(),
			links: d,
			startTime: s ? o.currentTimeNanosUnsafe() : Df,
			kind: n?.kind ?? "internal",
			root: n?.root ?? xs(i),
			sampled: n?.sampled ?? (Ss(i) && i.value.sampled === !1 ? !1 : !Kf(e.getRef(xl), u))
		});
		for (let e in c) a.attribute(e, c[e]);
		if (n?.attributes !== void 0) for (let e in n.attributes) a.attribute(e, n.attributes[e]);
	}
	return a;
}, Mf = (e, t, n, r) => K(() => {
	e.status._tag !== "Ended" && e.end(r ? n.currentTimeNanosUnsafe() : Df, t);
}), Nf = (e, ...t) => {
	let n = t.length === 1 ? void 0 : t[0], r = t[t.length - 1];
	return U((t) => {
		let i = jf(t, e, n), a = t.getRef(Ff), o = t.getRef(Ol);
		return Wd(t, (e) => Mf(i, e, a, o)), r(i);
	});
}, Pf = /*#__PURE__*/ sd(_l), Ff = /*#__PURE__*/ rc("effect/Clock", { defaultValue: () => new Lf() }), If = 2 ** 31 - 1, Lf = class {
	currentTimeMillisUnsafe() {
		return Date.now();
	}
	currentTimeMillis = /*#__PURE__*/ K(() => this.currentTimeMillisUnsafe());
	currentTimeNanosUnsafe() {
		return Bf();
	}
	currentTimeNanos = /*#__PURE__*/ K(() => this.currentTimeNanosUnsafe());
	monotonicTimeNanosUnsafe() {
		return zf();
	}
	monotonicTimeNanos = /*#__PURE__*/ K(() => this.monotonicTimeNanosUnsafe());
	sleep(e) {
		return this.sleepMillis(Yc(e));
	}
	sleepMillis(e) {
		return e <= 0 ? su : Number.isFinite(e) ? hu((t) => {
			let n = e > If ? this.sleepMillis(e - If) : J, r = setTimeout(() => t(n), Math.min(e, If));
			return K(() => clearTimeout(r));
		}) : gu;
	}
}, Rf = /*#__PURE__*/ BigInt(1e6), zf = /*#__PURE__*/ function() {
	let e = globalThis.process?.hrtime;
	if (typeof e?.bigint == "function") return () => e.bigint();
	if (typeof performance < "u" && typeof performance.now == "function") return () => BigInt(Math.round(performance.now() * 1e6));
	let t = /*#__PURE__*/ BigInt(0);
	return () => {
		let e = BigInt(Date.now()) * Rf;
		return e > t && (t = e), t;
	};
}(), Bf = /*#__PURE__*/ function() {
	let e = /*#__PURE__*/ BigInt(1e9), t;
	return () => {
		let n = zf(), r = BigInt(Date.now()) * Rf;
		if (t === void 0) t = r - n;
		else {
			let i = t + n;
			(r > i ? r - i : i - r) > e && (t = r - n);
		}
		return t + n;
	};
}(), Vf = (e) => U((t) => e(t.getRef(Ff))), Hf = (e) => Vf((t) => t.sleep(jc(e))), Uf = "~effect/Cause/AsyncFiberError", Wf = class extends (/*#__PURE__*/ Ro("AsyncFiberError")) {
	[Uf] = Uf;
	constructor(e) {
		super({
			message: "An asynchronous Effect was executed with Effect.runSync",
			fiber: e
		});
	}
}, Gf = /*#__PURE__*/ rc("effect/Console", { defaultValue: () => globalThis.console }), Kf = /*#__PURE__*/ vs(/* @__PURE__ */ _s(gs, (e) => {
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
})), qf = {
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
qf.gray, qf.blue, qf.green, qf.yellow, qf.red, qf.bgBrightRed, qf.black;
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/Cause.js
var Jf = wo, Yf = yo, Xf = So, Zf = Vl, Qf = Bo, $f = Wo, ep = H, tp = No, np = Po, rp = Zu, ip = Yu, ap = {
	"~effect/Deferred": {
		_A: L,
		_E: L
	},
	pipe() {
		return wi(this, arguments);
	}
}, op = function() {
	this.resumes = void 0, this.effect = void 0;
};
op.prototype = ap;
var sp = () => new op(), cp = (e) => hu((t) => e.effect ? t(e.effect) : (e.resumes ??= [], e.resumes.push(t), K(() => {
	let n = e.resumes;
	if (n === void 0) return;
	let r = n.indexOf(t);
	r >= 0 && n.splice(r, 1);
}))), lp = /* @__PURE__ */ I(2, (e, t) => K(() => fp(e, t))), up = /*#__PURE__*/ I(2, (e, t) => lp(e, No(t))), dp = /*#__PURE__*/ I(2, (e, t) => up(e, Fl(t))), fp = (e, t) => {
	if (e.effect) return !1;
	if (e.effect = t, e.resumes) {
		let n = e.resumes;
		e.resumes = void 0;
		for (let e = 0; e < n.length; e++) n[e](t);
	}
	return !0;
}, pp = Ed, mp = Ld, hp = Bd, gp = Nd, _p = Pd, vp = Md, yp = Dd, bp = "~effect/Layer", xp = "~effect/Layer/MemoMap", Sp = (e, t) => {
	let n = {
		observers: 0,
		deferred: sp(),
		scope: mp(),
		finalizer: (r) => q(() => --n.observers > 0 ? J : (e.map.delete(t), yp(n.scope, r)))
	};
	return n;
}, Cp = (e, t) => t.state._tag !== "Closed" && (e.observers++, Fd(t, {}, e.finalizer), !0), wp = {
	[bp]: {
		_ROut: L,
		_E: L,
		_RIn: L
	},
	pipe() {
		return wi(this, arguments);
	}
}, Tp = (e) => {
	let t = Object.create(wp);
	return t.build = e, t;
}, Ep = (e) => Tp((t, n) => {
	let r = vp(n);
	return Gd(e(t, r), (e) => e._tag === "Failure" ? yp(r, e) : J);
}), Dp = class {
	get [xp]() {
		return xp;
	}
	parent;
	constructor(e) {
		this.parent = e;
	}
	map = /*#__PURE__*/ new Map();
	get(e, t) {
		let n = this.map.get(e);
		return n ? (Cp(n, t), n.deferred.effect ?? cp(n.deferred)) : this.parent?.get(e, t);
	}
	getOrElseMemoize(e, t, n) {
		return q(() => {
			let r;
			return Ud(q(() => {
				let i = this.get(e, t);
				if (i) return i;
				let a = Sp(this, e);
				return Cp(a, t) ? (r = a.deferred, this.map.set(e, a), n(this, a.scope)) : n(this, t);
			}), (e) => {
				r && fp(r, e);
			});
		});
	}
}, Op = () => new Dp(), kp = (e) => new Dp(e), Ap = class e extends (/*#__PURE__*/ Ts()("effect/Layer/CurrentMemoMap")) {
	static forkOrCreate(t) {
		let n = Js(t, e);
		return n ? kp(n) : Op();
	}
}, jp = /*#__PURE__*/ I(3, (e, t, n) => sd(Ku(e.build(t, n), Ks(Ap, t)), Ap, t)), Mp = /*#__PURE__*/ I(2, (e, t) => U((n) => jp(e, Ap.forkOrCreate(n.context), t))), Np = function() {
	return arguments.length === 1 ? (e) => Pp(Gs(arguments[0], e)) : Pp(Gs(arguments[0], arguments[1]));
}, Pp = (e) => Tp(Di(G(e))), Fp = (e, t, n) => {
	let r = vp(n, "parallel");
	return sf(e, (e) => e.build(t, vp(r, "sequential")), { concurrency: e.length }).pipe(Ku((e) => nc(...e)));
}, Ip = (...e) => Ep((t, n) => Fp(e, t, n)), Lp = Ff, Rp = "~effect/DateTime", zp = "~effect/DateTime/TimeZone", Bp = {
	[Rp]: Rp,
	pipe() {
		return wi(this, arguments);
	},
	[Ha]() {
		return this.toString();
	},
	toJSON() {
		return Hp(this).toJSON();
	}
};
({ ...Bp }), { ...Bp };
var Vp = {
	[zp]: zp,
	[Ha]() {
		return this.toString();
	}
};
({ ...Vp }), { ...Vp };
var Hp = (e) => new Date(e.epochMilliseconds), Up = /*#__PURE__*/ I(2, (e, t) => md(e, qp, (e) => t(e))), Wp = (e) => e.reasons.some(Gp), Gp = (e) => e._tag === "Fail" && Qf(e.error), Kp = (e) => {
	let t, n = !1;
	for (let r of e.reasons) Gp(r) ? t ??= r.error : r._tag !== "Interrupt" && (n = !0);
	return t === void 0 ? sc(e) : n ? sc(Yf(e.reasons.filter((e) => !Gp(e)))) : oc(t);
}, qp = (e) => {
	let t = Kp(e);
	return lc(t) ? t : oc(t.success.value);
}, Jp = (e) => {
	let t = Kp(e);
	return lc(t) ? tp(t.failure) : ep(t.success.value);
}, Yp = (e, t, n) => Vd((r) => Uu(n?.local ? jp(t, Op(), r) : Mp(t, r), (t) => od(e, t))), Xp = /*#__PURE__*/ I((e) => co(e[0]), (e, t, n) => Vs(t) ? od(e, t) : Yp(e, Array.isArray(t) ? Ip(...t) : t, n)), Zp = sf, Qp = of, X = G, $p = q, em = K, tm = J, nm = hu, rm = _u, im = ou, am = au, om = lu, sm = uu, cm = U, Z = Uu, lm = Gu, um = Ru, dm = zu, fm = Sd, pm = Ku, mm = Eu, hm = Bu, gm = _d, _m = dd, vm = vd, ym = Hf, bm = Hu, xm = ld, Sm = yd, Cm = rd, wm = ad, Tm = Xp, Em = sd, Dm = qd, Om = Gd, km = Xd, Am = Yd, jm = Zd, Mm = ud, Nm = gf, Pm = hf, Fm = yf, Im = _f, Lm = Sf, Rm = xf, zm = vu, Bm = xu, Vm = qu, Hm = Wu, Um = Cu, Wm = "~effect/BigDecimal", Gm = {
	[Wm]: Wm,
	[Ji]() {
		let e = $m(this);
		return Zi(ta(String(e.value)), ea(e.scale));
	},
	[fa](e) {
		return Km(e) && ih(this, e) === 0;
	},
	toString() {
		return `BigDecimal(${oh(this)})`;
	},
	toJSON() {
		return {
			_id: "BigDecimal",
			value: String(this.value),
			scale: this.scale
		};
	},
	[Ha]() {
		return this.toJSON();
	},
	pipe() {
		return wi(this, arguments);
	}
}, Km = (e) => R(e, Wm), qm = (e, t) => {
	if (!Number.isSafeInteger(t)) throw RangeError(`Scale must be a safe integer, got ${t}`);
	let n = Object.create(Gm);
	return n.value = e, n.scale = t, n;
}, Jm = (e, t) => {
	let n = qm(e, t);
	return n.normalized = n, n;
}, Ym = /*#__PURE__*/ BigInt(0), Xm = /*#__PURE__*/ BigInt(1), Zm = /*#__PURE__*/ BigInt(10), Qm = /*#__PURE__*/ Jm(Ym, 0), $m = (e) => {
	if (e.normalized === void 0) {
		if (e.value === Ym) e.normalized = Qm;
		else {
			let t = `${e.value}`, n = t.length;
			for (; t[n - 1] === "0";) n--;
			e.normalized = Jm(BigInt(t.slice(0, n)), e.scale - (t.length - n));
		}
	}
	return e.normalized;
}, eh = 100, th = [Xm], nh = (e, t) => e === t ? 0 : e < t ? -1 : 1, rh = (e, t) => {
	let n = `${e.value < Ym ? -e.value : e.value}`, r = `${t.value < Ym ? -t.value : t.value}`, i = BigInt(n.length - r.length) - BigInt(e.scale) + BigInt(t.scale);
	if (i !== Ym) return i < Ym ? -1 : 1;
	let a = Math.max(n.length, r.length);
	return hs(n.padEnd(a, "0"), r.padEnd(a, "0"));
}, ih = (e, t) => {
	if (e.scale === t.scale) return nh(e.value, t.value);
	let n = ah(e), r = ah(t);
	if (n !== r) return n < r ? -1 : 1;
	if (n === 0) return 0;
	let i = e.scale - t.scale, a = Math.abs(i);
	if (a > eh) return n === -1 ? rh(t, e) : rh(e, t);
	let o = th[a] ??= Zm ** BigInt(a);
	return i > 0 ? nh(e.value, t.value * o) : nh(e.value * o, t.value);
}, ah = (e) => e.value === Ym ? 0 : e.value < Ym ? -1 : 1, oh = (e) => {
	let t = $m(e);
	if (Math.abs(t.scale) >= 16) return sh(t);
	let n = t.value < Ym, r = `${n ? -t.value : t.value}`, i = t.scale > 0 ? r.padStart(t.scale + 1, "0") : r.padEnd(r.length - t.scale, "0"), a = i.length - t.scale, o = t.scale > 0 ? `${i.slice(0, a)}.${i.slice(a)}` : i;
	return n ? `-${o}` : o;
}, sh = (e) => {
	if (ch(e)) return "0e+0";
	let t = $m(e), n = `${t.value}`, r = t.value < Ym ? 2 : 1, i = n.slice(0, r), a = n.slice(r), o = a.length - t.scale;
	return `${i}${a === "" ? "" : `.${a}`}e${o >= 0 ? "+" : ""}${o}`;
}, ch = (e) => e.value === Ym, lh = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", uh = /*#__PURE__*/ (/* @__PURE__ */ new Uint8Array(123)).fill(255);
for (let e = 0; e < 64; e++) uh[/*#__PURE__*/ lh.charCodeAt(e)] = e;
uh[61] = 0, { ...Wa }, { ...Wa }, { ...oo };
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/internal/schema/annotations.js
function dh(e) {
	return e.checks ? e.checks[e.checks.length - 1].annotations : e.annotations;
}
var fh = "~sentinels", ph = "~constructor", mh = /*#__PURE__*/ Mi((e) => {
	let t = dh(e)?.identifier;
	return typeof t == "string" ? t : e.getExpected(mh);
}), Q = /*#__PURE__*/ Symbol(), hh = ep, gh = /*#__PURE__*/ hh(Q), $ = /*#__PURE__*/ hh(Q), _h = (e) => e === Q ? ys() : bs(e), vh = (e) => e._tag === "None" ? gh : hh(e.value), yh = "~effect/SchemaIssue/Issue";
function bh(e) {
	return R(e, yh) && e[yh] === yh;
}
function xh(e) {
	return Object.hasOwn(e, "input");
}
var Sh = class {
	[yh] = yh;
	constructor(e, t) {
		t?.reportInput === !0 && e !== Q && (this.input = e);
	}
}, Ch = class extends Sh {
	_tag = "Filter";
	filter;
	issue;
	constructor(e, t, n, r) {
		super(n, r), this.filter = e, this.issue = t;
	}
}, wh = class extends Sh {
	_tag = "Encoding";
	ast;
	issue;
	constructor(e, t, n, r) {
		super(n, r), this.ast = e, this.issue = t;
	}
}, Th = class extends Sh {
	_tag = "Pointer";
	path;
	issue;
	constructor(e, t) {
		super(), this.path = e, this.issue = t;
	}
}, Eh = class extends Sh {
	_tag = "MissingKey";
	annotations;
	constructor(e) {
		super(), this.annotations = e;
	}
}, Dh = class extends Sh {
	_tag = "UnexpectedKey";
	ast;
	constructor(e, t, n) {
		super(t, n), this.ast = e;
	}
}, Oh = class extends Sh {
	_tag = "Composite";
	ast;
	issues;
	constructor(e, t, n, r) {
		super(n, r), this.ast = e, this.issues = t;
	}
}, kh = class extends Sh {
	_tag = "InvalidType";
	ast;
	constructor(e, t, n) {
		super(t, n), this.ast = e;
	}
}, Ah = class extends Sh {
	_tag = "InvalidValue";
	annotations;
	constructor(e, t, n) {
		super(t, n), this.annotations = e;
	}
}, jh = class extends Sh {
	_tag = "AnyOf";
	ast;
	issues;
	constructor(e, t, n, r) {
		super(n, r), this.ast = e, this.issues = t;
	}
}, Mh = class extends Sh {
	_tag = "OneOf";
	ast;
	successes;
	constructor(e, t, n, r) {
		super(n, r), this.ast = e, this.successes = t;
	}
};
function Nh(e, t, n) {
	if (bh(e)) return e;
	if (typeof e == "string") return new Ah({ message: e }, t, n);
	let r = typeof e.issue == "string" ? new Ah({ message: e.issue }, t, n) : e.issue;
	return new Th(e.path, r);
}
function Ph(e, t, n) {
	if (e !== void 0) return typeof e == "boolean" ? e ? void 0 : new Ah(void 0, t, n) : Nh(e, t, n);
}
function Fh(e, t, n, r) {
	return Array.isArray(t) ? gc(t) ? t.length === 1 ? Nh(t[0], n, r) : new Oh(e, bc(t, (e) => Nh(e, n, r)), n, r) : void 0 : Ph(t, n, r);
}
var Ih = (e) => {
	let t = Gh(e);
	if (t !== void 0) return t;
	switch (e._tag) {
		case "InvalidType": return Bh(mh(e.ast), e);
		case "InvalidValue": {
			let t = zh(e);
			if (t !== void 0) return Bh(t, e);
			let n = Rh(e);
			return n === void 0 ? "Expected a valid value" : `Invalid data ${n}`;
		}
		case "MissingKey": return "Missing key";
		case "UnexpectedKey": {
			let t = Rh(e);
			return t === void 0 ? "Expected no excess property" : `Unexpected key with value ${t}`;
		}
		case "Forbidden": return "Forbidden operation";
		case "OneOf": {
			let t = Rh(e);
			return t === void 0 ? "Expected exactly one member to match" : `Expected exactly one member to match the input ${t}`;
		}
	}
}, Lh = (e) => Gh(e.issue) ?? Gh(e);
function Rh(e) {
	return xh(e) ? Fa(e.input) : void 0;
}
function zh(e) {
	let t = e.annotations?.expected;
	return typeof t == "string" ? t : void 0;
}
function Bh(e, t) {
	let n = Rh(t);
	return n === void 0 ? `Expected ${e}` : `Expected ${e}, got ${n}`;
}
function Vh(e) {
	let t = e.annotations?.expected;
	if (typeof t == "string") return t;
	switch (e._tag) {
		case "Filter": return "<filter>";
		case "FilterGroup": return e.checks.map((e) => Vh(e)).join(" & ");
	}
}
function Hh() {
	return (e) => Wh(e, "");
}
var Uh = /*#__PURE__*/ Hh();
function Wh(e, t) {
	let n;
	switch (e._tag) {
		case "Filter": {
			let r = Lh(e);
			if (r !== void 0) n = r;
			else {
				if (e.issue._tag !== "InvalidValue") return Wh(e.issue, t);
				let r = zh(e.issue);
				n = r === void 0 ? Bh(Vh(e.filter), e) : Bh(r, e.issue);
			}
			break;
		}
		case "Encoding": return Wh(e.issue, t);
		case "Pointer": return Wh(e.issue, t + Ra(e.path));
		case "Composite":
		case "AnyOf":
			if (e._tag === "Composite" || e.issues.length > 0) return e.issues.map((e) => Wh(e, t)).join("\n");
			n = Gh(e) ?? Bh(mh(e.ast), e);
			break;
		default: n = Ih(e);
	}
	return t ? `${n}\n  at ${t}` : n;
}
function Gh(e) {
	if (e._tag === "Pointer") return;
	if (e._tag === "Encoding") return Gh(e.issue);
	let t = (e._tag === "Filter" ? e.filter.annotations : "annotations" in e ? e.annotations : e.ast.annotations)?.[e._tag === "MissingKey" ? "messageMissingKey" : e._tag === "UnexpectedKey" ? "messageUnexpectedKey" : "message"];
	if (typeof t == "string") return t;
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/internal/schema/cause.js
function Kh(e) {
	let t;
	for (let n of e.reasons) {
		if (!Jf(n) || !bh(n.error)) return;
		t ??= n.error;
	}
	return t;
}
function qh(e, t) {
	let n = Kh(e);
	if (n === void 0) throw Error(t, { cause: e });
	return n;
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/SchemaGetter.js
var Jh = (e) => Object.assign(Object.create(Ti), e), Yh = /*#__PURE__*/ Jh({ _tag: "Passthrough" });
function Xh() {
	return Yh;
}
function Zh(e) {
	return Jh({
		_tag: "Transform",
		transform: e
	});
}
function Qh() {
	return Zh(globalThis.String);
}
function $h() {
	return Zh(globalThis.Number);
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/SchemaTransformation.js
var eg = class extends Ei {
	_tag = "Middleware";
	decode;
	encode;
	constructor(e, t) {
		super(), this.decode = e, this.encode = t;
	}
	flip() {
		return new eg(this.encode, this.decode);
	}
}, tg = "~effect/SchemaTransformation/Transformation", ng = class extends Ei {
	[tg] = tg;
	_tag = "Transformation";
	decode;
	encode;
	constructor(e, t) {
		super(), this.decode = e, this.encode = t;
	}
	flip() {
		return new ng(this.encode, this.decode);
	}
};
function rg(e) {
	return R(e, tg) && e[tg] === tg;
}
var ig = (e) => rg(e) ? e : new ng(e.decode, e.encode), ag = /*#__PURE__*/ new ng(/*#__PURE__*/ Xh(), /*#__PURE__*/ Xh());
function og() {
	return ag;
}
var sg = /*#__PURE__*/ new ng(/*#__PURE__*/ $h(), /*#__PURE__*/ Qh());
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/SchemaAST.js
function cg(e) {
	return (t) => t._tag === e;
}
var lg = /*#__PURE__*/ cg("Declaration"), ug = /*#__PURE__*/ cg("Never"), dg = /*#__PURE__*/ cg("Literal"), fg = /*#__PURE__*/ cg("UniqueSymbol"), pg = /*#__PURE__*/ cg("Arrays"), mg = /*#__PURE__*/ cg("Objects"), hg = /*#__PURE__*/ cg("Suspend"), gg = class {
	to;
	transformation;
	constructor(e, t) {
		this.to = e, this.transformation = t;
	}
}, _g = {}, vg = class {
	isOptional;
	isMutable;
	constructorDefault;
	annotations;
	constructor(e, t, n = void 0, r = void 0) {
		this.isOptional = e, this.isMutable = t, this.constructorDefault = n, this.annotations = r;
	}
}, yg = "~effect/Schema", bg = class {
	[yg] = yg;
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
}, xg = class extends bg {
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
		return (t, n) => t === Q ? gh : (e ??= this.run(this.typeParameters))(t, this, n);
	}
	_rebuild(e, t, n, r, i) {
		let a = F_(this.typeParameters, e);
		return a === this.typeParameters && t === this.checks && n === this.encodingChecks && r === this.run && i === this.encodingRun ? this : new xg(a, r, this.annotations, t, void 0, this.context, n, i);
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
}, Sg = /*#__PURE__*/ new class extends bg {
	_tag = "Unknown";
	getParser() {
		return Q_(this, Gi);
	}
	getExpected() {
		return "unknown";
	}
}(), Cg = class extends bg {
	_tag = "Literal";
	literal;
	constructor(e, t, n, r, i) {
		if (super(t, n, r, i), typeof e == "number" && !globalThis.Number.isFinite(e)) throw Error(`A numeric literal must be finite, got ${Fa(e)}`);
		this.literal = e;
	}
	getParser() {
		return Z_(this, this.literal);
	}
	matchPart(e, t) {
		return e === globalThis.String(this.literal) ? this.literal : void 0;
	}
	toCodecJson() {
		return typeof this.literal == "bigint" ? wg(this) : this;
	}
	toCodecStringTree() {
		return typeof this.literal == "string" ? this : wg(this);
	}
	getExpected() {
		return typeof this.literal == "string" ? JSON.stringify(this.literal) : globalThis.String(this.literal);
	}
};
function wg(e) {
	let t = globalThis.String(e.literal);
	return w_(e, [new gg(new Cg(t), new ng(Zh(() => e.literal), Zh(() => t)))]);
}
var Tg = /*#__PURE__*/ new class extends bg {
	_tag = "String";
	getParser() {
		return Q_(this, zi);
	}
	matchPart(e, t) {
		let n = this.checks;
		return n && !t.disableChecks && ov(n, e, void 0, this, t) ? void 0 : e;
	}
	getExpected() {
		return "string";
	}
}(), Eg = class extends bg {
	_tag = "Number";
	getParser() {
		return Q_(this, Bi);
	}
	matchKey(e, t) {
		return this._match(tv, e, t);
	}
	matchPart(e, t) {
		return this._match(ev, e, t);
	}
	_match(e, t, n) {
		if (!e.test(t)) return;
		let r = globalThis.Number(t);
		return n.disableChecks || !this.checks ? r : ov(this.checks, r, void 0, this, n) ? void 0 : r;
	}
	toCodecJson() {
		return this.checks && (Dg(this.checks, "effect/schema/isFinite") || Dg(this.checks, "effect/schema/isInt")) ? this : w_(this, [y_]);
	}
	toCodecStringTree() {
		return this.toCodecJson() === this ? w_(this, [iv]) : w_(this, [av]);
	}
	getExpected() {
		return "number";
	}
};
function Dg(e, t) {
	return e.some((e) => e.annotations?.representation?.id === t || e._tag === "FilterGroup" && Dg(e.checks, t));
}
var Og = /*#__PURE__*/ new Eg(), kg = class extends bg {
	_tag = "Arrays";
	isMutable;
	elements;
	rest;
	encodingChecks;
	constructor(e, t, n, r, i, a, o, s) {
		super(r, i, a, o), this.isMutable = e, this.elements = t, this.rest = n, this.encodingChecks = s;
		let c = !1;
		for (let e = 0; e < t.length; e++) if (H_(t[e])) c = !0;
		else if (c) throw Error("A required element cannot follow an optional element. ts(1257)");
		if (c && n.length > 1) throw Error("A required element cannot follow an optional element. ts(1257)");
		for (let e = 1; e < n.length; e++) if (H_(n[e])) throw Error("An optional element cannot follow a rest element. ts(1266)");
	}
	getParser(e, t = e) {
		let n = this, r, i, a = n.elements.length, o = Math.max(0, n.rest.length - 1);
		function s(e, t) {
			return t < a ? r[t] : t >= e ? i[t - e + 1] : i[0];
		}
		let c = (e) => {
			let { input: t, len: r, options: i } = e;
			if (n.rest.length === 0 && r > a) for (let o = a; o < r; o++) {
				let r = new Dh(n, t[o], i), a = new Th([o], r);
				if (i.errors === "all") e.issues ? e.issues.push(a) : e.issues = [a];
				else return im(new Oh(n, [a], t, i));
			}
			return e.issues ? im(new Oh(n, e.issues, t, i)) : hh(e.output);
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
			}, u = n.rest.length === 0 ? a : Math.max(r, a + o), d = t.concurrency === void 0 ? 1 : lf(t.concurrency), f = d === 1 ? Mg(i, e, 0, u) : Ng(i, e, {
				concurrency: d,
				end: u
			});
			if (!f) return c(i);
			if (Y(f)) return Hm(f, () => c(i));
			let p = !0;
			return $p(() => p ? (p = !1, Z(f, () => c(i))) : l(e, t));
		};
		return (e, a) => {
			if (e === Q) return gh;
			try {
				return Array.isArray(e) ? (r || (r = n.elements.map((e) => ({
					ast: e,
					parser: t(e)
				})), i = n.rest.map((e) => ({
					ast: e,
					parser: t(e)
				}))), l(e, a)) : im(new kh(n, e, a));
			} catch (e) {
				return sm(e);
			}
		};
	}
	_rebuild(e, t, n) {
		let r = F_(this.elements, e), i = F_(this.rest, e);
		return r === this.elements && i === this.rest && t === this.checks && n === this.encodingChecks ? this : new kg(this.isMutable, r, i, this.annotations, t, void 0, this.context, n);
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
function Ag(e, t, n, r) {
	if (n._tag === "Failure") return Pg(e, e.ast, r, n);
	let i = n === $ ? t : n[B];
	if (i !== Q) e.output[r] = i;
	else {
		let t = e.getParser(e.tailThreshold, r);
		if (H_(t.ast)) return;
		let n = new Th([r], new Eh(t.ast.context?.annotations));
		if (e.options.errors === "all") e.issues ? e.issues.push(n) : e.issues = [n];
		else return np(new Oh(e.ast, [n], e.input, e.options));
	}
}
var jg = {
	onItem(e, t, n) {
		let r = n < e.len ? t : Q;
		return e.getParser(e.tailThreshold, n).parser(r, e.options);
	},
	step: Ag
}, Mg = /*#__PURE__*/ uf()(jg), Ng = /*#__PURE__*/ ff()(jg), Pg = (e, t, n, r) => {
	if (r.cause.reasons.length === 0) return r;
	let i = Kh(r.cause);
	if (i === void 0) return tp(Zf(r.cause, (r) => new Oh(t, [new Th([n], r)], e.input, e.options)));
	let a = new Th([n], i);
	if (e.options.errors === "all") e.issues ? e.issues.push(a) : e.issues = [a];
	else return np(new Oh(t, [a], e.input, e.options));
}, Fg = "[+-]?\\d*\\.?\\d+(?:[Ee][+-]?\\d+)?";
function Ig(e, t, n = _g) {
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
	return a($_(q_(t)));
}
var Lg = class {
	name;
	type;
	constructor(e, t) {
		this.name = e, this.type = t;
	}
};
function Rg(e) {
	switch (e._tag) {
		case "String":
		case "Number":
		case "Symbol":
		case "TemplateLiteral": return !0;
		case "Union": return e.types.every(Rg);
		default: return !1;
	}
}
function zg(e) {
	let t = E_(e);
	switch (t._tag) {
		case "String":
		case "Number":
		case "Symbol":
		case "TemplateLiteral": return !0;
		case "Union": return t.types.every(zg);
		default: return !1;
	}
}
function Bg(e) {
	return Rg(e) && zg(e);
}
var Vg = class {
	parameter;
	type;
	constructor(e, t) {
		if (!Bg(e)) throw Error(`Invalid index signature parameter ${e._tag}`);
		if (this.parameter = e, this.type = t, H_(t) && !X_(t)) throw Error("Cannot use `Schema.optionalKey` with index signatures, use `Schema.optional` instead.");
	}
}, Hg = class extends bg {
	_tag = "Objects";
	propertySignatures;
	indexSignatures;
	encodingChecks;
	constructor(e, t, n, r, i, a, o) {
		super(n, r, i, a), this.propertySignatures = e, this.indexSignatures = t, this.encodingChecks = o;
	}
	getParser(e, t = e) {
		let n = this, r = n.propertySignatures.length, i = n.indexSignatures.length;
		if (!r && !i) return Q_(n, Wi);
		let a, o, s = () => (a || (a = n.propertySignatures.map((e) => ({
			parser: t(e.type),
			name: e.name,
			type: e.type
		})), o = i ? n.indexSignatures.map((n) => ({
			is: n,
			parserKey: e($_(n.parameter)),
			parserValue: t(n.type)
		})) : void 0), a), c = () => {
			let e = new Set(n.propertySignatures.map((e) => typeof e.name == "number" ? globalThis.String(e.name) : e.name)), t = (t, i, a, o, s) => {
				if (s._tag === "Failure") return Pg(t, n, i, s) ?? rp;
				let c = s === $ ? o : s[B];
				if (a !== Q && c !== Q) {
					if (r && (e.has(i) || e.has(typeof a == "number" ? globalThis.String(a) : a))) return rp;
					Xa(t.out, a, c);
				}
				return rp;
			}, c = (e, r, i, a) => {
				if (!a) {
					let t = i.parserKey(r, e.options);
					if (!Y(t)) return Z(fm(t), (t) => c(e, r, i, t));
					a = t;
				}
				if (a._tag === "Failure") return Pg(e, n, r, a) ?? rp;
				let o = a === $ ? r : a[B], s = e.input[r], l = i.parserValue(s, e.options);
				return Y(l) ? t(e, r, o, s, l) : Z(fm(l), (n) => t(e, r, o, s, n));
			}, l = (e, n, r) => {
				let i = e.input[n], a = r.parserValue(i, e.options);
				return Y(a) ? t(e, n, n, i, a) : Z(fm(a), (r) => t(e, n, n, i, r));
			}, u = i ? ff()({
				onItem: (e, [t, n]) => n.is.parameter === Tg ? l(e, t, n) : c(e, t, n),
				step: (e, t, n) => n._tag === "Failure" ? n : void 0
			}) : void 0;
			return Um(function* (t, d) {
				if (t === Q) return Q;
				if (typeof t != "object" || !t || Array.isArray(t)) return yield* im(new kh(n, t, d));
				s();
				let f = t, p = {}, m = {
					ast: n,
					input: f,
					out: p,
					issues: void 0,
					options: d
				}, h = d.errors === "all", g = d.onExcessProperty === "error", _ = d.concurrency === void 0 ? 1 : lf(d.concurrency), ee = i && g ? n.indexSignatures.map((e) => Ig(f, e.parameter, d)) : void 0;
				if (g) {
					let r = ee ? new Set(e) : e;
					if (ee) for (let e of ee) for (let t of e) r.add(t);
					let i = Reflect.ownKeys(f);
					for (let e = 0; e < i.length; e++) {
						let a = i[e];
						if (!r.has(a) && Object.prototype.propertyIsEnumerable.call(f, a)) {
							let e = new Dh(n, f[a], d), r = new Th([a], e);
							if (h) {
								m.issues ? m.issues.push(r) : m.issues = [r];
								continue;
							}
							return yield* im(new Oh(n, [r], t, d));
						}
					}
				}
				if (r) {
					let e = _ === 1 ? Gg(m, a) : Kg(m, a, { concurrency: _ });
					e && (yield* e);
				}
				if (i && _ === 1) for (let e = 0; e < i; e++) {
					let t = o[e], n = t.is.parameter === Tg ? l : c, r = ee?.[e] ?? (t.is.parameter === Tg ? Object.keys(f) : Ig(f, t.is.parameter, d));
					for (let e = 0; e < r.length; e++) {
						let i = n(m, r[e], t);
						if (!Y(i)) yield* i;
						else if (i._tag === "Failure") return yield* i;
					}
				}
				else if (u) {
					let e = vc();
					for (let t = 0; t < i; t++) {
						let n = o[t], r = ee?.[t] ?? (n.is.parameter === Tg ? Object.keys(f) : Ig(f, n.is.parameter, d));
						for (let t = 0; t < r.length; t++) e.push([r[t], n]);
					}
					let t = u(m, e, { concurrency: _ });
					t && (yield* t);
				}
				return m.issues ? yield* im(new Oh(n, m.issues, t, d)) : p;
			});
		};
		if (i) return c();
		let l, u = (e, t, n) => {
			let r = a[t];
			return Z(fm(n), (n) => {
				let i = Ug(e, r, n);
				if (i) return i;
				let o = () => hh(e.out), s = Gg(e, a.slice(t + 1));
				return s ? Hm(s, o) : o();
			});
		};
		return (e, t) => {
			if (e === Q) return gh;
			if (t.errors === "all" || t.onExcessProperty !== void 0 || t.concurrency !== void 0 && lf(t.concurrency) !== 1) return (l ??= c())(e, t);
			if (typeof e != "object" || !e || Array.isArray(e)) return im(new kh(n, e, t));
			let r = s(), i = e, a = {}, o = {
				ast: n,
				input: i,
				out: a,
				issues: void 0,
				options: t
			};
			try {
				for (let e = 0; e < r.length; e++) {
					let n = r[e], s = n.name, c = r_(i, s), l = c ? i[s] : Q, d = n.parser(l, t);
					if (!Y(d)) return u(o, e, d);
					if (d === $) {
						c && Xa(a, s, l);
						continue;
					}
					let f = Ug(o, n, d);
					if (f) return f;
				}
			} catch (e) {
				return sm(e);
			}
			return hh(a);
		};
	}
	_rebuild(e, t, n, r) {
		let i = F_(this.propertySignatures, (t) => {
			let n = e(t.type);
			return n === t.type ? t : new Lg(t.name, n);
		}), a = F_(this.indexSignatures, (n) => {
			let r = t(n.parameter), i = e(n.type);
			return r === n.parameter && i === n.type ? n : new Vg(r, i);
		});
		return i === this.propertySignatures && a === this.indexSignatures && n === this.checks && r === this.encodingChecks ? this : new Hg(i, a, this.annotations, n, void 0, this.context, r);
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
function Ug(e, t, n) {
	if (n._tag === "Failure") return Pg(e, e.ast, t.name, n);
	if (n === $) return;
	let r = n[B];
	if (r !== Q) {
		Xa(e.out, t.name, r);
		return;
	}
	if (delete e.out[t.name], !H_(t.type)) {
		let n = new Th([t.name], new Eh(t.type.context?.annotations));
		if (e.options.errors === "all") {
			e.issues ? e.issues.push(n) : e.issues = [n];
			return;
		}
		return np(new Oh(e.ast, [n], e.input, e.options));
	}
}
var Wg = {
	onItem(e, t) {
		if (!r_(e.input, t.name)) return t.parser(Q, e.options);
		let n = e.input[t.name];
		return Xa(e.out, t.name, n), t.parser(n, e.options);
	},
	step: Ug
}, Gg = /*#__PURE__*/ uf()(Wg), Kg = /*#__PURE__*/ ff()(Wg);
function qg(e, t) {
	return e ? t ? [...e, ...t] : e : t;
}
function Jg(e, t, n) {
	return new Hg(Reflect.ownKeys(e).map((t) => new Lg(t, e[t].ast)), [], n, t);
}
function Yg(e) {
	return e.ast;
}
function Xg(e, t, n) {
	return new a_(e.map(Yg), t, void 0, n);
}
var Zg = /*#__PURE__*/ Ni((e) => {
	for (;;) {
		if (hg(e)) return Sg;
		let t = e.encoding;
		if (!t) return e.recur?.(Zg, L) ?? e;
		if (t.some((e) => e.transformation._tag === "Middleware" && e.transformation.decode !== L)) return Sg;
		e = t[t.length - 1].to;
	}
});
function Qg(e) {
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
		case "Union": return Array.from(new Set(e.types.flatMap(Qg)));
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
function $g(e) {
	switch (e._tag) {
		default: return [];
		case "Declaration": {
			let t = e.annotations?.[fh];
			return Array.isArray(t) ? t : [];
		}
		case "Objects": return e.propertySignatures.flatMap((e) => {
			let t = e.type;
			if (!H_(t)) {
				if (dg(t)) return [{
					key: e.name,
					literal: t.literal
				}];
				if (fg(t)) return [{
					key: e.name,
					literal: t.symbol
				}];
			}
			return [];
		});
		case "Arrays": return e.elements.flatMap((e, t) => {
			if (!H_(e)) {
				if (dg(e)) return [{
					key: t,
					literal: e.literal
				}];
				if (fg(e)) return [{
					key: t,
					literal: e.symbol
				}];
			}
			return [];
		});
		case "Union": {
			if (e.types.length === 0) return [];
			let t = e.types.map((e) => $g(Zg(e)));
			return t[0].filter((e) => t.every((t) => t.some((t) => t.key === e.key && t.literal === e.literal)));
		}
		case "Suspend": return $g(e.thunk());
	}
}
var e_ = /*#__PURE__*/ new WeakMap(), t_ = /*#__PURE__*/ Object.freeze([]), n_ = (e) => e === null ? "null" : Array.isArray(e) ? "array" : typeof e, r_ = (e, t) => t === "__proto__" ? Object.hasOwn(e, t) : t in e;
function i_(e) {
	let t = e_.get(e);
	if (t) return t;
	let n, r = 0, i, a, o = !0, s = [];
	for (let t = 0; t < e.length; t++) {
		let c = e[t], l = Zg(c);
		if (ug(l)) continue;
		if (dg(l) || fg(l)) {
			a ??= /* @__PURE__ */ new Map();
			let e = dg(l) ? l.literal : l.symbol;
			s[t] = e;
			let n = a.get(e);
			n || a.set(e, n = []), n.push(t);
		} else o = !1;
		let u = $g(l);
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
			let e = Qg(l);
			for (let n of e) (i[n] ??= []).push(t);
		}
	}
	let c = {}, l = (e) => c[e] ??= Object.freeze(i?.[e] ?? t_);
	if (o && a) a.forEach(Object.freeze), t = (e) => a.get(e) ?? t_;
	else if (n?.size === 1 && !i) {
		let [r, [i]] = n.entries().next().value, a = /* @__PURE__ */ new Map();
		for (let [e, t] of i) a.set(e, Object.freeze(Array.from(t)));
		let o = Object.freeze(e.map((e, t) => t));
		t = (e, t) => {
			if (Ki(e)) {
				let n = r_(e, r) ? e[r] : void 0;
				if (n !== void 0) return a.get(n) ?? t_;
				if (t) return o;
			}
			return t_;
		};
	} else if (n) {
		let e;
		for (let t of n) (!e || t[1][0].size > e[1][0].size) && t[1][1].size === r && (e = t);
		t = (t, r) => {
			let a = n_(t);
			if (!Ki(t)) return l(a);
			let o = new Set(i?.[a]), s;
			if (e) {
				let [n, [i]] = e, c = r_(t, n), u = c ? t[n] : void 0;
				if (c && (!r || u !== void 0)) {
					let e = i.get(u);
					if (!e) return l(a);
					for (let t of e) o.add(t);
					s = n;
				}
			}
			if (s === void 0) for (let [e, [i, a]] of n) {
				let n = r_(t, e), s = n ? t[e] : void 0;
				if (n && (!r || s !== void 0)) {
					let e = i.get(s);
					if (e) for (let t of e) o.add(t);
				} else if (r) for (let e of a) o.add(e);
			}
			for (let [e, [i, a]] of n) {
				if (e === s) continue;
				let n = r_(t, e), c = n ? t[e] : void 0;
				if (n && (!r || c !== void 0)) {
					let e = i.get(c);
					for (let t of o) a.has(t) && !e?.has(t) && o.delete(t);
				}
			}
			return Array.from(o).sort((e, t) => e - t);
		};
	} else t = (e) => {
		let t = l(n_(e));
		return a ? t.filter((t) => s[t] === void 0 || s[t] === e) : t;
	};
	return e_.set(e, t), t;
}
var a_ = class extends bg {
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
			if (e === Q) return gh;
			let i = (o ??= i_(n.types))(e, r);
			if (i.length === 0) return im(new jh(n, [], e, t));
			if (i.length === 1) {
				let r = a(i[0])(e, t);
				return r._tag === "Success" ? r : Y(r) ? o_(n, r.cause, e, t) : s_(n, r, e, t);
			}
			return c_(n, a, i, e, t);
		};
	}
	_rebuild(e, t, n) {
		let r = F_(this.types, e);
		return r === this.types && t === this.checks && n === this.encodingChecks ? this : new a_(r, this.options, this.annotations, t, void 0, this.context, n);
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
			let n = q_(t);
			switch (n._tag) {
				case "Arrays": {
					let t = n.elements.filter(dg);
					if (t.length > 0) return `${f_(n.isMutable)}[ ${t.map((t) => e(t) + p_(t.context?.isOptional)).join(", ")}, ... ]`;
					break;
				}
				case "Objects": {
					let t = n.propertySignatures.filter((e) => dg(e.type));
					if (t.length > 0) return `{ ${t.map((t) => `${f_(t.type.context?.isMutable)}${La(t.name)}${p_(t.type.context?.isOptional)}: ${e(t.type)}`).join(", ")}, ... }`;
					break;
				}
			}
			return e(n);
		});
		return Array.from(new Set(n)).join(" | ");
	}
};
function o_(e, t, n, r) {
	let i = Kh(t);
	return i ? np(new jh(e, [i], n, r)) : tp(t);
}
function s_(e, t, n, r) {
	return _m(t, (t) => o_(e, t, n, r));
}
function c_(e, t, n, r, i) {
	let a = {
		ast: e,
		parser: t,
		input: r,
		out: void 0,
		successes: e.options?.mode === "oneOf" ? [] : void 0,
		issues: void 0,
		options: i
	}, o = u_(a, n);
	return o ? l_(o, a) : a.out ? a.out : im(new jh(e, a.issues ?? [], r, i));
}
function l_(e, t) {
	return Hm(e, (e) => t.out === $ ? X(t.input) : t.out ? t.out : im(new jh(t.ast, t.issues ?? [], t.input, t.options)));
}
var u_ = /*#__PURE__*/ uf()({
	onItem(e, t) {
		return e.parser(t)(e.input, e.options);
	},
	step(e, t, n) {
		if (n._tag === "Failure") {
			let t = Kh(n.cause);
			if (t === void 0) return n;
			e.issues ? e.issues.push(t) : e.issues = [t];
		} else {
			if (e.out && e.successes) return e.successes.push(e.ast.types[t]), np(new Mh(e.ast, e.successes, e.input, e.options));
			if (e.out = n, e.successes) e.successes.push(e.ast.types[t]);
			else return rp;
		}
	}
}), d_ = /*#__PURE__*/ new a_([
	/*#__PURE__*/ new Cg("Infinity"),
	/*#__PURE__*/ new Cg("-Infinity"),
	/*#__PURE__*/ new Cg("NaN")
]);
function f_(e) {
	return e ? "" : "readonly ";
}
function p_(e) {
	return e ? "?" : "";
}
var m_ = class extends Ei {
	_tag = "Filter";
	run;
	annotations;
	aborted;
	constructor(e, t = void 0, n = !1) {
		super(), this.run = e, this.annotations = t, this.aborted = n;
	}
	annotate(e) {
		return new m_(this.run, {
			...this.annotations,
			...e
		}, this.aborted);
	}
	abort() {
		return new m_(this.run, this.annotations, !0);
	}
	and(e, t) {
		return new h_([this, e], t);
	}
}, h_ = class extends Ei {
	_tag = "FilterGroup";
	checks;
	annotations;
	constructor(e, t = void 0) {
		super(), this.checks = e, this.annotations = t;
	}
	annotate(e) {
		return new h_(this.checks, {
			...this.annotations,
			...e
		});
	}
	and(e, t) {
		return new h_([this, e], t);
	}
};
function g_(e, t, n = !1) {
	return new m_((t, n, r) => Fh(n, e(t, n, r), t, r), t, n);
}
function __(e) {
	return g_((e) => globalThis.Number.isFinite(e), {
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
var v_ = /*#__PURE__*/ k_(Og, [/*#__PURE__*/ __()]), y_ = /*#__PURE__*/ new gg(/*#__PURE__*/ new a_([v_, d_]), /*#__PURE__*/ new ng(/*#__PURE__*/ $h(), /*#__PURE__*/ Zh((e) => globalThis.Number.isFinite(e) ? e : globalThis.String(e))));
function b_(e, t) {
	let n = new globalThis.RegExp(e), r = {
		source: n.source,
		flags: n.flags
	};
	return g_((e) => (n.lastIndex = 0, n.test(e)), {
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
var x_ = /*#__PURE__*/ new WeakMap();
function S_(e, t) {
	let n = Object.assign(Object.create(Object.getPrototypeOf(e)), e, t);
	return Reflect.ownKeys(t).every((e) => e === "context" || e === "encoding") && x_.set(n, C_(e)), n;
}
function C_(e) {
	let t = x_.get(e);
	if (t !== void 0) return t;
	if (e.encoding === void 0) return e;
	let n = Object.assign(Object.create(Object.getPrototypeOf(e)), e, { encoding: void 0 });
	return x_.set(e, n), n;
}
function w_(e, t) {
	return e.encoding === t ? e : S_(e, { encoding: t });
}
function T_(e, t) {
	if (e.context === t) return e;
	let n = C_(e);
	return n.context === t && n.encoding === e.encoding ? n : S_(e, { context: t });
}
function E_(e) {
	return e.encoding ? E_(e.encoding[e.encoding.length - 1].to) : e;
}
function D_(e, t) {
	if (e.checks) {
		let n = e.checks[e.checks.length - 1];
		return O_(e, mc(e.checks.slice(0, -1), n.annotate(t)));
	}
	return S_(e, { annotations: {
		...e.annotations,
		...t
	} });
}
function O_(e, t) {
	if (e._tag === "Suspend" && t) throw Error("Cannot add checks to Suspend");
	return e.checks === t ? e : S_(e, { checks: t });
}
function k_(e, t) {
	return O_(e, qg(e.checks, t));
}
function A_(e, t) {
	let n = t(e.to);
	return n === e.to ? e : new gg(n, e.transformation);
}
function j_(e, t) {
	let n = e, r = n[n.length - 1], i = A_(r, t);
	return i === r ? e : mc(e.slice(0, e.length - 1), i);
}
function M_(e) {
	return (t) => t.encoding ? w_(t, j_(t.encoding, e)) : t;
}
function N_(e, t) {
	function n(r) {
		if (r.encoding) {
			let e = r.encoding[r.encoding.length - 1];
			return t?.stopAt?.(e) ? r : w_(r, j_(r.encoding, n));
		}
		return e(r);
	}
	return Ni(n);
}
function P_(e, t, n) {
	let r = new gg(e, t);
	return w_(n, n.encoding ? [...n.encoding, r] : [r]);
}
function F_(e, t) {
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
function I_(e, t) {
	return T_(e, e.context ? new vg(e.context.isOptional, e.context.isMutable, e.context.constructorDefault, {
		...e.context.annotations,
		...t
	}) : new vg(!1, !1, void 0, t));
}
var L_ = /*#__PURE__*/ Ni((e) => R_(T_(e, e.context ? e.context.isOptional === !1 ? new vg(!0, e.context.isMutable, e.context.constructorDefault, e.context.annotations) : e.context : new vg(!0, !1)))), R_ = /*#__PURE__*/ M_(L_);
function z_(e, t, n) {
	return P_(e, n, t);
}
function B_(e) {
	let t = [], n = [];
	function r(e) {
		switch (e._tag) {
			case "Literal":
				Hi(e.literal) && !t.includes(e.literal) && t.push(e.literal);
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
function V_(e, t) {
	let { literals: n, parameters: r } = B_(e);
	return new Hg(n.map((e) => new Lg(e, t)), r.map((e) => new Vg(e, t)));
}
function H_(e) {
	return e.context?.isOptional ?? !1;
}
function U_(e) {
	return e.annotations?.["~structural"] === !0 || e._tag === "FilterGroup" && e.checks.every(U_);
}
function W_(e) {
	function t(e) {
		return U_(e) ? [e] : e._tag === "FilterGroup" ? e.checks.flatMap(t) : [];
	}
	let n = e.flatMap(t);
	return hc(n) ? n : void 0;
}
function G_(e) {
	let t = !0;
	function n(e) {
		return t = t && !e.encoding && !hg(e), t && "recur" in e && e.recur(n), e;
	}
	return "recur" in e && e.recur(n), t;
}
var K_ = /*#__PURE__*/ Ni((e) => {
	let t = C_(e);
	if (t !== e) {
		let n = K_(t);
		return n === t && e.encoding === void 0 ? e : T_(n, e.context);
	}
	let n = "recur" in e ? e.recur(K_) : e;
	if ("encodingChecks" in n && n.encodingChecks) {
		let t = G_(e) ? n.encodingChecks : pg(n) || mg(n) || lg(n) && n.typeParameters.length > 0 ? W_(n.encodingChecks) : void 0;
		return S_(n, {
			encodingChecks: void 0,
			checks: qg(n.checks, t)
		});
	}
	return n;
}), q_ = /*#__PURE__*/ Ni((e) => K_(Y_(e)));
function J_(e, t) {
	let n = t, r = n.length, i = n[r - 1], a = [new gg(Y_(w_(e, void 0)), n[0].transformation.flip())];
	for (let e = 1; e < r; e++) a.unshift(new gg(Y_(n[e - 1].to), n[e].transformation.flip()));
	let o = Y_(i.to);
	return o.encoding ? w_(o, [...o.encoding, ...a]) : w_(o, a);
}
var Y_ = /*#__PURE__*/ Mi((e) => {
	if (e.encoding) return J_(e, e.encoding);
	let t = C_(e);
	if (t !== e) {
		let n = Y_(t);
		return n === t ? e : T_(n, e.context);
	}
	return "flip" in e ? e.flip(Y_) : "recur" in e ? e.recur(Y_) : e;
});
function X_(e) {
	switch (e._tag) {
		case "Undefined": return !0;
		case "Union": return e.types.some(X_);
		default: return !1;
	}
}
function Z_(e, t) {
	let n = t === 0 ? $ : hh(t);
	return (r, i) => r === Q ? gh : r === t ? n : im(new kh(e, r, i));
}
function Q_(e, t) {
	return (n, r) => n === Q ? gh : t(n) ? $ : im(new kh(e, n, r));
}
var $_ = /*#__PURE__*/ N_((e) => {
	switch (e._tag) {
		default: return e;
		case "Number": return e.toCodecStringTree();
		case "Union": return e.recur($_);
	}
}), ev = /*#__PURE__*/ new globalThis.RegExp(`^${Fg}$`), tv = /*#__PURE__*/ new globalThis.RegExp(`^(?:${Fg}|Infinity|-Infinity|NaN)$`);
function nv(e) {
	return b_(ev, {
		expected: "a string representing a finite number",
		representation: {
			id: "effect/schema/isStringFinite",
			payload: null
		},
		toJsonSchema: () => ({ pattern: ev.source }),
		...e
	});
}
var rv = /*#__PURE__*/ k_(Tg, [/*#__PURE__*/ nv()]), iv = /*#__PURE__*/ new gg(rv, sg), av = /*#__PURE__*/ new gg(/*#__PURE__*/ new a_([rv, d_]), sg);
function ov(e, t, n, r, i) {
	for (let a = 0; a < e.length; a++) {
		let o = e[a];
		if (o._tag === "FilterGroup") {
			if (n = ov(o.checks, t, n, r, i), n && (i.errors !== "all" || n[n.length - 1].filter.aborted)) return n;
		} else {
			let e = o.run(t, r, i);
			if (e) {
				let r = new Ch(o, e, t, i);
				if (n ? n.push(r) : n = [r], i.errors !== "all" || o.aborted) return n;
			}
		}
	}
	return n;
}
function sv(e) {
	if (!lg(e)) return;
	let t = e.annotations?.[ph];
	return Ui(t) ? t(e.typeParameters) : void 0;
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/internal/schema/interpreter.js
var cv = (e, t, n) => e === $ ? n(t) : Hm(e, n);
function lv(e) {
	if (e._tag === "Middleware") return (t, n, r) => uv(t === $ ? e.decode(hh(_h(n)), r) : e.decode(Vm(t, _h), r));
	let t = e.decode;
	switch (t._tag) {
		case "Passthrough": return (e, t) => e === $ ? hh(t) : e;
		case "Transform": {
			let e = (e) => e === Q ? gh : hh(t.transform(e));
			return (t, n) => cv(t, n, e);
		}
		case "TransformOptional": {
			let e = (e) => vh(t.transform(_h(e)));
			return (t, n) => cv(t, n, e);
		}
		case "TransformEffect": return (e, n, r) => cv(e, n, (e) => e === Q ? gh : t.transform(e, r));
		case "TransformOptionalEffect": return (e, n, r) => cv(e, n, (e) => uv(t.transform(_h(e), r)));
	}
}
var uv = (e) => Hm(e, vh), dv = (e, t, n, r) => _m(r, (r) => om(() => Zf(r, (r) => new wh(e, r, t, n))));
function fv(e, t) {
	let n = lv(e.link.transformation), r;
	return (i, a) => {
		if (i === Q) return gh;
		if (e.isConstructed(i)) return $;
		let o = (r ??= t(e.link.to))(i, a);
		return n(o, i, a);
	};
}
function pv(e, t) {
	let n = e.context.constructorDefault;
	return (r, i) => {
		if (r !== Q && r !== void 0) return t(r, i);
		let a = n;
		if (Y(a) && a._tag === "Success") {
			let e = t(a[B], i);
			return e === $ ? a : e;
		}
		return Hm(dv(e, r, i, a), (e) => {
			let n = t(e, i);
			return n === $ ? hh(e) : n;
		});
	};
}
function mv(e, t) {
	let n = t(e);
	return e.context?.constructorDefault === void 0 ? n : pv(e, n);
}
function hv(e, t, n, r, i) {
	if (e._tag === "Declaration") for (let n of e.typeParameters) t(n);
	let a = n ? sv(e) : void 0, o = a ? fv(a, t) : r ?? e.getParser(t, n), s = e.checks, c = e.encoding, l = c?.map((e) => lv(e.transformation)), u = e.encodingChecks;
	if (!c && !s && !u) return o;
	let d, f = (t, n) => {
		let r = o(t, n);
		if (u && !n.disableChecks) {
			if (Y(r)) {
				if (r._tag === "Success") {
					let i = r === $ ? t : r[B];
					if (t !== Q && i !== Q) {
						let i = ov(u, t, void 0, e, n);
						i && (r = im(new Oh(e, i, t, n)));
					}
				}
			} else r = Z(r, (r) => {
				if (t !== Q && r !== Q) {
					let r = ov(u, t, void 0, e, n);
					if (r) return im(new Oh(e, r, t, n));
				}
				return X(r);
			});
		}
		if (s && !n.disableChecks) {
			if (Y(r)) {
				if (r._tag === "Success") {
					let i = r === $ ? t : r[B];
					if (i === Q) return r;
					let a = ov(s, i, void 0, e, n);
					a && (r = im(new Oh(e, a, i, n)));
				}
			} else r = Z(r, (t) => {
				if (t !== Q) {
					let r = ov(s, t, void 0, e, n);
					if (r) return im(new Oh(e, r, t, n));
				}
				return X(t);
			});
		}
		return r;
	}, p = i === void 0 ? f : i(f);
	return c ? (n, r) => {
		let i = d ??= c.map((e) => t(e.to)), a = n, o = i[i.length - 1](n, r);
		for (let e = c.length - 1; e >= 0; e--) if (o = l[e](o, a, r), e !== 0) {
			let t = i[e - 1];
			o._tag === "Success" ? (a = o[B], o = t(a, r)) : o = Hm(o, (e) => {
				let n = t(e, r);
				return n === $ ? hh(e) : n;
			});
		}
		if (o._tag === "Success") {
			let e = o[B], t = p(e, r);
			return t === $ ? o : t;
		}
		return o = dv(e, n, r, o), Hm(o, (e) => {
			let t = p(e, r);
			return t === $ ? hh(e) : t;
		});
	} : p;
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/internal/schema/compilerRegistry.js
var gv = /*#__PURE__*/ Symbol(), _v = /*#__PURE__*/ new WeakMap(), vv = (e) => Sv(e).parser, yv = (e) => Sv(e).makeEffect, bv = (e) => mv(e, yv), xv = class {
	ast;
	constructor(e) {
		this.ast = e;
	}
	get decodeEffect() {
		return this.cachedDecodeEffect ??= hv(this.ast, vv);
	}
	get parser() {
		return this.decodeEffect;
	}
	get makeEffect() {
		return this.cachedMakeEffect ??= hv(this.ast, yv, bv);
	}
};
function Sv(e) {
	let t = _v.get(e);
	if (t !== void 0) return t;
	let n = new xv(e);
	return _v.set(e, n), n;
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/SchemaParser.js
function Cv(e) {
	let t = e.ast, n;
	return (e, r) => (n ??= jv(Fv, K_(t)))(e, r?.disableChecks ? r?.parseOptions ? {
		...r.parseOptions,
		disableChecks: !0
	} : { disableChecks: !0 } : r?.parseOptions);
}
function wv(e) {
	let t = Cv(e);
	return (e, n) => {
		let r = Rm(t(e, n));
		return ip(r) ? bs(r.value) : (qh(r.cause, "Option adapter can only return none for schema issues"), ys());
	};
}
function Tv(e) {
	return Nv(K_(e.ast));
}
function Ev(e, t) {
	let n = kv(e.ast);
	return t === void 0 ? n : (e, r) => n(e, Dv(t, r));
}
var Dv = (e, t) => t ? {
	...e,
	...t
} : e, Ov = (e) => e === Q ? im(new Ah()) : X(e);
function kv(e) {
	return jv(Pv, e);
}
function Av(e, t) {
	return e === $ ? X(t) : Y(e) ? e[B] === Q ? Ov(Q) : e : Hm(e, Ov);
}
function jv(e, t) {
	let n;
	return (r, i) => {
		let a = (n ??= e(t))(r, i ?? _g);
		return a === $ ? X(r) : Y(a) ? a[B] === Q ? Ov(Q) : a : Hm(a, Ov);
	};
}
function Mv(e, t) {
	let n = Rm(e);
	if (ip(n)) return n.value;
	let r = qh(n.cause, t);
	throw Error("Schema validation failed", { cause: r });
}
function Nv(e) {
	let t, n;
	return (r, i) => {
		t ??= Sv(e);
		let a = i?.disableChecks ? i.parseOptions ? {
			...i.parseOptions,
			disableChecks: !0
		} : { disableChecks: !0 } : i?.parseOptions ?? _g, o = t.make;
		if (o !== void 0 && r !== Q) {
			let e;
			try {
				e = o(r, a);
			} catch (e) {
				throw qh(Xf(e), "Constructor adapter can only throw schema issues"), e;
			}
			if (e !== gv && e !== Q) return e;
		}
		return Mv(Av((n ??= t.makeEffect)(r, a), r), "Constructor adapter can only throw schema issues");
	};
}
var Pv = (e) => Sv(e).parser, Fv = (e) => Sv(e).makeEffect, Iv = "~effect/Schema/Schema", Lv = /*#__PURE__*/ Symbol(), Rv = {
	[Iv]: Iv,
	get make() {
		let e = Tv(this);
		return Object.defineProperty(this, "make", {
			value: e,
			enumerable: !0
		}), e;
	},
	get makeEffect() {
		let e = Cv(this);
		return Object.defineProperty(this, "makeEffect", {
			value: e,
			enumerable: !0
		}), e;
	},
	get makeOption() {
		let e = wv(this);
		return Object.defineProperty(this, "makeOption", {
			value: e,
			enumerable: !0
		}), e;
	},
	pipe() {
		return wi(this, arguments);
	},
	annotate(e) {
		return this.rebuild(D_(this.ast, e));
	},
	annotateKey(e) {
		return this.rebuild(I_(this.ast, e));
	},
	check(...e) {
		return this.rebuild(k_(this.ast, e));
	},
	rebuild(e) {
		return zv(e, this[Lv]);
	}
};
function zv(e, t) {
	function n() {}
	let r = Object.setPrototypeOf(n, Rv);
	return t && (Object.hasOwn(t, "name") || Object.hasOwn(t, "length") || Object.hasOwn(t, "__proto__")) ? Object.defineProperties(r, Object.getOwnPropertyDescriptors({ ...t })) : Object.assign(r, t), r[Lv] = t, r.ast = e, r;
}
//#endregion
//#region ../../node_modules/.bun/effect@4.0.0/node_modules/effect/dist/Struct.js
var Bv = (e) => e, Vv = "~effect/Schema/SchemaError", Hv = class extends (/*#__PURE__*/ ul("SchemaError")) {
	[Vv] = Vv;
	constructor(e) {
		let t = Ka();
		qa(0);
		try {
			super({ issue: e });
		} finally {
			qa(t);
		}
	}
	get message() {
		return Uh(this.issue);
	}
	toString() {
		return `SchemaError(${this.message})`;
	}
};
function Uv(e) {
	return Y(e) ? Wv(e) : _m(e, (e) => om(() => Zf(e, (e) => new Hv(e))));
}
function Wv(e) {
	return ip(e) ? e : tp(Zf(e.cause, (e) => new Hv(e)));
}
function Gv(e, t) {
	let n = Ev(e, t);
	return (e, t) => Uv(n(e, t));
}
var Kv = zv, qv = /*#__PURE__*/ Bv((e) => Kv(L_(e.ast), { schema: e }));
function Jv(e) {
	let t = Kv(new Cg(e), {
		literal: e,
		transform(n) {
			return t.pipe(ry(Jv(n), {
				decode: Zh(() => n),
				encode: Zh(() => e)
			}));
		}
	});
	return t;
}
var Yv = /*#__PURE__*/ Kv(Tg);
function Xv(e, t) {
	return Kv(e, {
		fields: t,
		mapFields(e, t) {
			let n = e(this.fields);
			return Xv(Jg(n, t?.unsafePreserveChecks ? this.ast.checks : void 0), n);
		}
	});
}
function Zv(e) {
	return Xv(Jg(e, void 0), e);
}
function Qv(e, t) {
	return Kv(V_(e.ast, t.ast), {
		key: e,
		value: t
	});
}
var $v = /*#__PURE__*/ Bv((e) => Kv(new kg(!1, [], [e.ast]), { value: e }));
function ey(e, t) {
	return Kv(e, {
		members: t,
		mapMembers(e, t) {
			let n = e(this.members);
			return ey(Xg(n, this.ast.options, t?.unsafePreserveChecks ? this.ast.checks : void 0), n);
		}
	});
}
function ty(e, t) {
	return ey(Xg(e, t, void 0), e);
}
function ny(e) {
	let t = e.map(Jv);
	return Kv(Xg(t, void 0, void 0), {
		literals: e,
		members: t,
		mapMembers(e) {
			return ty(e(this.members));
		},
		pick(e) {
			return ny(e);
		},
		transform(e) {
			return ty(t.map((t, n) => t.transform(e[n])));
		}
	});
}
function ry(e, t) {
	return (n) => Kv(z_(n.ast, e.ast, t ? ig(t) : og()), {
		from: n,
		to: e
	});
}
var iy = /*#__PURE__*/ Kv(v_);
globalThis.RegExp, globalThis.URL, globalThis.File, globalThis.FormData, globalThis.URLSearchParams, globalThis.Uint8Array;
var ay = tu, oy = vf, sy = Ef, cy = "~effect/MutableRef", ly = {
	[cy]: cy,
	...oo,
	toJSON() {
		return {
			_id: "MutableRef",
			current: Ua(this.current)
		};
	}
}, uy = (e) => {
	let t = Object.create(ly);
	return t.current = e, t;
}, dy = /*#__PURE__*/ I(2, (e, t) => (e.current = t, e)), fy = /*#__PURE__*/ Symbol.for("effect/MutableList/Empty"), py = () => ({
	head: void 0,
	tail: void 0,
	length: 0
}), my = (e) => {
	let t = e.head;
	t.offset >= 1024 && t === e.tail && t.mutable && (t.array.length - t.offset) * 8 <= t.offset && (e.head = e.tail = {
		array: t.array.slice(t.offset),
		mutable: !0,
		offset: 0,
		next: void 0
	});
}, hy = () => ({
	array: [],
	mutable: !0,
	offset: 0,
	next: void 0
}), gy = (e, t) => {
	e.tail ? e.tail.mutable || (e.tail.next = hy(), e.tail = e.tail.next) : e.head = e.tail = hy(), e.tail.array.push(t), e.length++;
}, _y = (e, t) => {
	e.head = {
		array: [t],
		mutable: !0,
		offset: 0,
		next: e.head
	}, e.tail ||= e.head, e.length++;
}, vy = (e) => {
	e.head = e.tail = void 0, e.length = 0;
}, yy = (e, t) => {
	if (t = ac(t), t <= 0 || !e.head) return [];
	if (t = Math.min(t, e.length), t === e.length && e.head?.offset === 0 && !e.head.next) {
		let t = e.head.array;
		return vy(e), t;
	}
	let n = Array(t), r = 0, i = e.head;
	for (; i;) {
		for (; i.offset < i.array.length;) if (n[r++] = i.array[i.offset], i.mutable && (i.array[i.offset] = void 0), i.offset++, r === t) return e.head = i.offset === i.array.length && i.next ? i.next : i, e.length -= t, e.length === 0 ? vy(e) : my(e), n;
		i = i.next;
	}
	return vy(e), n;
}, by = (e) => yy(e, e.length), xy = (e) => {
	if (!e.head) return fy;
	let t = e.head.array[e.head.offset];
	return e.head.mutable && (e.head.array[e.head.offset] = void 0), e.head.offset++, e.length--, e.head.offset === e.head.array.length ? e.head.next ? e.head = e.head.next : vy(e) : my(e), t;
}, Sy = (e, t) => {
	let n = [], r = e.head, i = 0;
	for (; r;) {
		for (let e = r.offset; e < r.array.length; e++) t(r.array[e], i++) && n.push(r.array[e]);
		r = r.next;
	}
	if (n.length === 0) {
		vy(e);
		return;
	}
	e.head = e.tail = {
		array: n,
		mutable: !0,
		offset: 0,
		next: void 0
	}, e.length = n.length;
}, Cy = (e, t) => Sy(e, (e) => e !== t), wy = "~effect/PubSub", Ty = "~effect/PubSub/Subscription", Ey = (e) => em(() => Hy(e.atomicPubSub(), /* @__PURE__ */ new Map(), mp(), sy(!1), uy(!1), e.strategy(), uy(ys()))), Dy = (e) => Ey({
	atomicPubSub: () => Oy(e),
	strategy: () => new Uy()
}), Oy = (e) => {
	let t = e?.replay;
	return new Ry(t && t > 0 ? new Ky(Math.ceil(t)) : void 0);
}, ky = /*#__PURE__*/ I(2, (e, t) => e.shutdownFlag.current || Ss(e.ended.current) ? !1 : e.pubsub.publish(t) ? (e.strategy.completeSubscribersUnsafe(e.pubsub, e.subscribers), !0) : !1), Ay = (e) => jm(wm((t) => {
	let n = Zs(t, pp), r = vp(e.scope), i = Ly(e.pubsub, e.subscribers, e.strategy, e.ended);
	return _p(r, jy(i)).pipe(um(gp(n, (e) => yp(r, e))), mm(i));
})), jy = (e) => jm(cm((t) => (dy(e.shutdownFlag, !0), Zp(by(e.pollers), (e) => dp(e, t.id), {
	discard: !0,
	concurrency: "unbounded"
}).pipe(dm(() => em(() => {
	e.subscribers.delete(e.subscription), e.subscription.unsubscribe(), e.replayWindow.close(), e.strategy.onPubSubEmptySpaceUnsafe(e.pubsub, e.subscribers);
})), xm(e.shutdownHook.open), hm)))), My = (e) => $p(function t(n) {
	if (e.shutdownFlag.current) return km;
	let r = e.pollers.length === 0 ? e.subscription.pollUpTo(Infinity) : [];
	return n && (r = n.concat(r)), e.strategy.onPubSubEmptySpaceUnsafe(e.pubsub, e.subscribers), e.replayWindow.remaining > 0 ? X(e.replayWindow.takeAll().concat(r)) : hc(r) ? X(r) : Z(Ny(e), (e) => t([e]));
}), Ny = (e) => nm((t) => {
	if (e.shutdownFlag.current) return t(km);
	if (Ss(e.ended.current)) return t(X(e.ended.current.value));
	let n = sp(), r = e.subscribers.get(e.subscription);
	return r || (r = /* @__PURE__ */ new Set(), e.subscribers.set(e.subscription, r)), r.add(e.pollers), gy(e.pollers, n), e.strategy.completePollersUnsafe(e.pubsub, e.subscribers, e.subscription, e.pollers), n.effect ? t(n.effect) : (n.resumes = [t], em(() => Cy(e.pollers, n)));
}), Py = /*#__PURE__*/ Symbol.for("effect/PubSub/AbsentValue"), Fy = (e, t, n) => {
	e.has(t) || e.set(t, /* @__PURE__ */ new Set()), e.get(t).add(n);
}, Iy = (e, t, n) => {
	if (!e.has(t)) return;
	let r = e.get(t);
	r.delete(n), r.size === 0 && e.delete(t);
}, Ly = (e, t, n, r) => new By(e, t, e.subscribe(), py(), sy(!1), uy(!1), n, e.replayWindow(), r), Ry = class {
	publisherHead = {
		value: Py,
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
		return this.replayBuffer ? new qy(this.replayBuffer) : Jy;
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
			this.publisherHead = this.publisherHead.next, this.publisherHead.value = Py, this.subscribersIndex += 1, this.replayBuffer?.slide(t, e.replayIndex);
		}
	}
	subscribe() {
		return this.publisherTail.subscribers += 1, new zy(this, this.publisherTail, this.publisherIndex, !1);
	}
}, zy = class {
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
		for (; t;) this.subscriberHead === this.self.publisherTail ? t = !1 : this.subscriberHead.next.value === Py ? (this.subscriberHead = this.subscriberHead.next, this.subscriberIndex += 1) : (e = !1, t = !1);
		return e;
	}
	size() {
		return this.unsubscribed ? 0 : this.self.publisherIndex - Math.max(this.subscriberIndex, this.self.subscribersIndex);
	}
	poll() {
		if (this.unsubscribed) return fy;
		let e = !0, t = fy;
		for (; e;) if (this.subscriberHead === this.self.publisherTail) e = !1;
		else {
			let n = this.subscriberHead.next.value;
			n !== Py && (t = n, --this.subscriberHead.subscribers, this.subscriberHead.subscribers === 0 && (this.self.publisherHead = this.self.publisherHead.next, this.self.publisherHead.value = Py, this.self.subscribersIndex += 1), e = !1), this.subscriberHead = this.subscriberHead.next, this.subscriberIndex += 1;
		}
		return t;
	}
	pollUpTo(e) {
		e = ac(e);
		let t = [], n = 0;
		for (; n !== e;) {
			let r = this.poll();
			r === fy ? n = e : (t.push(r), n += 1);
		}
		return t;
	}
	unsubscribe() {
		if (!this.unsubscribed) for (this.unsubscribed = !0, --this.self.publisherTail.subscribers; this.subscriberHead !== this.self.publisherTail;) this.subscriberHead.next.value !== Py && (--this.subscriberHead.subscribers, this.subscriberHead.subscribers === 0 && (this.self.publisherHead = this.self.publisherHead.next, this.self.publisherHead.value = Py, this.self.subscribersIndex += 1)), this.subscriberHead = this.subscriberHead.next;
	}
}, By = class {
	[Ty] = { _A: L };
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
		return wi(this, arguments);
	}
}, Vy = class {
	[wy] = { _A: L };
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
		return wi(this, arguments);
	}
}, Hy = (e, t, n, r, i, a, o) => new Vy(e, t, n, r, i, a, o), Uy = class {
	get shutdown() {
		return tm;
	}
	handleSurplus(e, t, n, r) {
		return X(!1);
	}
	onPubSubEmptySpaceUnsafe(e, t) {}
	completePollersUnsafe(e, t, n, r) {
		return Wy(this, e, t, n, r);
	}
	completeSubscribersUnsafe(e, t) {
		return Gy(this, e, t);
	}
}, Wy = (e, t, n, r, i) => {
	let a = !0;
	for (; a && !r.isEmpty();) {
		let o = xy(i);
		if (o === fy) Iy(n, r, i), i.length === 0 ? a = !1 : Fy(n, r, i);
		else {
			let a = r.poll();
			a === fy ? _y(i, o) : (fp(o, ep(a)), e.onPubSubEmptySpaceUnsafe(t, n));
		}
	}
}, Gy = (e, t, n) => {
	for (let [r, i] of n) for (let a of i) e.completePollersUnsafe(t, n, r, a);
}, Ky = class {
	capacity;
	head = {
		value: Py,
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
			value: Py,
			index: 0,
			next: null
		}, this.tail = this.tail.next, this.size === this.capacity ? this.head = this.head.next : this.size += 1, t;
	}
	offerAll(e) {
		for (let t of e) this.offer(t);
	}
}, qy = class {
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
		return this.values[this.index] = Py, this.index = (this.index + 1) % this.values.length, this.remaining--, this.remaining === 0 && this.close(), e;
	}
	takeN(e) {
		e = ac(e);
		let t = Math.min(e, this.remaining), n = Array(t);
		for (let e = 0; e < t; e++) n[e] = this.take();
		return n;
	}
	takeAll() {
		return this.takeN(this.remaining);
	}
}, Jy = {
	remaining: 0,
	take: () => void 0,
	takeN: () => [],
	takeAll: () => [],
	close: () => void 0
}, Yy = "~effect/Queue", Xy = "~effect/Queue/Enqueue", Zy = "~effect/Queue/Dequeue", Qy = {
	_A: L,
	_E: L
}, $y = {
	[Yy]: Qy,
	[Xy]: Qy,
	[Zy]: Qy,
	...oo,
	toJSON() {
		return {
			_id: "effect/Queue",
			state: this.state._tag,
			size: fb(this)
		};
	}
}, eb = (e) => U((t) => {
	let n = Object.create($y);
	return n.dispatcher = t.currentDispatcher, n.capacity = e?.capacity ?? Infinity, n.strategy = e?.strategy ?? "suspend", n.messages = py(), n.scheduleRunning = !1, n.state = {
		_tag: "Open",
		takers: /* @__PURE__ */ new Set(),
		offers: /* @__PURE__ */ new Set(),
		awaiters: /* @__PURE__ */ new Set()
	}, G(n);
}), tb = (e) => eb({ capacity: e }), nb = /*#__PURE__*/ I(2, (e, t) => q(() => rb(e, t) ? mb : e.state._tag === "Open" && e.strategy === "suspend" ? Sb(e, t) : pb)), rb = (e, t) => e.state._tag === "Open" ? e.messages.length >= e.capacity ? e.strategy === "sliding" ? (xy(e.messages), gy(e.messages, t), !0) : e.capacity <= 0 && e.state.takers.size > 0 && (gy(e.messages, t), _b(e), !0) : (gy(e.messages, t), vb(e), !0) : !1, ib = /*#__PURE__*/ I(2, (e, t) => K(() => ab(e, t))), ab = (e, t) => {
	if (e.state._tag !== "Open") return !1;
	let n = $u(No(t), hb);
	return e.state.offers.size === 0 && e.messages.length === 0 ? (Db(e, n), !0) : (e.state = {
		...e.state,
		_tag: "Closing",
		exit: n
	}, vb(e), !0);
}, ob = (e) => K(() => sb(e)), sb = (e) => {
	if (e.state._tag === "Done") return !1;
	vy(e.messages);
	let t = e.state.offers;
	Db(e, e.state._tag === "Open" ? gb : e.state.exit);
	for (let e of t) wb(e);
	return !0;
}, cb = (e) => lb(e, 1, Infinity), lb = /*#__PURE__*/ I(3, (e, t, n) => (t = ac(t), n = ac(n), q(() => yb(e, t, n) ?? Ru(xb(e, () => bb(e, t)), lb(e, t, n))))), ub = (e) => q(() => db(e) ?? Ru(xb(e, () => bb(e, 1)), ub(e))), db = (e) => {
	if (e.state._tag === "Done") return e.state.exit;
	if (e.messages.length > 0) {
		let t = xy(e.messages);
		return Eb(e), H(t);
	}
	if (e.capacity <= 0 && e.state.offers.size > 0) {
		let t = Tb(e.state.offers);
		return Eb(e), H(t);
	}
}, fb = (e) => e.state._tag === "Done" ? 0 : e.messages.length, pb = /*#__PURE__*/ H(!1), mb = /*#__PURE__*/ H(!0), hb = /*#__PURE__*/ Po(/*#__PURE__*/ Ho()), gb = /*#__PURE__*/ Ju(), _b = (e) => {
	if (e.state._tag !== "Done" && e.state.takers.size !== 0) {
		for (let t of e.state.takers) if (t.ready() && (e.state.takers.delete(t), t.resume(Zu), e.messages.length === 0)) break;
	}
}, vb = (e) => {
	e.scheduleRunning || e.state._tag === "Done" || e.state.takers.size === 0 || (e.scheduleRunning = !0, e.dispatcher.scheduleTask(() => {
		e.scheduleRunning = !1, _b(e);
	}, 0));
}, yb = (e, t, n) => {
	if (e.state._tag === "Done") return e.state.exit;
	if (n <= 0 || t <= 0) return H([]);
	if (!bb(e, t)) return;
	let r = e.messages.length > 0 ? yy(e.messages, n) : [Tb(e.state.offers)];
	return Eb(e), H(r);
}, bb = (e, t) => e.messages.length >= (e.state._tag === "Closing" ? 1 : Math.min(t, e.capacity || 1)) || e.capacity <= 0 && e.state._tag !== "Done" && e.state.offers.size > 0, xb = (e, t) => hu((n) => {
	if (e.state._tag === "Done") return n(e.state.exit);
	if (t()) return n(Zu);
	let r = {
		ready: t,
		resume: n
	};
	return e.state.takers.add(r), K(() => {
		e.state._tag !== "Done" && e.state.takers.delete(r);
	});
}), Sb = (e, t) => hu((n) => rb(e, t) ? n(mb) : Cb(e, {
	_tag: "Single",
	message: t,
	resume: n
})), Cb = (e, t) => {
	if (e.state._tag !== "Open") return wb(t);
	let n = e.state.offers;
	return n.add(t), K(() => {
		e.state._tag !== "Done" && (n.delete(t), e.state._tag === "Closing" && n.size === 0 && e.messages.length === 0 && Db(e, e.state.exit));
	});
}, wb = (e) => e._tag === "Single" ? e.resume(pb) : e.resume(H(e.remaining.slice(e.offset))), Tb = (e) => {
	let t = e.values().next().value;
	if (t._tag === "Single") return e.delete(t), t.resume(mb), t.message;
	let n = t.remaining[t.offset++];
	return t.offset === t.remaining.length && (e.delete(t), t.resume(H([]))), n;
}, Eb = (e) => {
	if (e.state._tag === "Done") return Wp(e.state.exit.cause);
	if (e.state.offers.size === 0) return e.state._tag === "Closing" && e.messages.length === 0 && (Db(e, e.state.exit), Wp(e.state.exit.cause));
	for (let t of e.state.offers) {
		let n = e.capacity - e.messages.length;
		if (n <= 0) break;
		if (t._tag === "Single") gy(e.messages, t.message), e.state.offers.delete(t), t.resume(mb);
		else {
			for (; t.offset < t.remaining.length; t.offset++) {
				if (n === 0) return !1;
				gy(e.messages, t.remaining[t.offset]), n--;
			}
			e.state.offers.delete(t), t.resume(H([]));
		}
	}
	return !1;
}, Db = (e, t) => {
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
}, Ob = (e) => new Ab(e), kb = (e, t, n) => hu((r) => {
	if (e.free >= t) return r(n);
	let i = () => {
		e.free < t || (e.waiters.delete(i), r(n));
	};
	return e.waiters.add(i), K(() => {
		e.waiters.delete(i);
	});
}), Ab = class {
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
		let t = q(() => this.free < e ? kb(this, e, t) : (this.taken += e, G(e)));
		return t;
	}
	takeIfAvailable(e) {
		return q(() => this.free < e ? G(!1) : (this.taken += e, G(!0)));
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
		return U((t) => (this.permits = e, this.free < 0 || this.releaseUnsafe(t, 0), J));
	}
	release(e) {
		return U((t) => G(this.releaseUnsafe(t, e)));
	}
	get releaseAll() {
		return U((e) => G(this.releaseUnsafe(e, this.taken)));
	}
	withPermits(e) {
		return (t) => af((n) => {
			let r = q(() => this.free < e ? Uu(n(kb(this, e, J)), () => r) : (this.taken += e, Ud(n(t), () => {
				this.releaseUnsafe(Kl(), e);
			}, !0)));
			return r;
		});
	}
	withPermit = /*#__PURE__*/ this.withPermits(1);
	withPermitsIfAvailable(e) {
		return (t) => af((n) => this.free < e ? cu : (this.taken += e, Ud(n(Lu(t)), () => {
			this.releaseUnsafe(Kl(), e);
		}, !0)));
	}
}, jb = "~effect/Channel", Mb = (e) => R(e, jb), Nb = {
	[jb]: {
		_Env: L,
		_InErr: L,
		_InElem: L,
		_OutErr: L,
		_OutElem: L
	},
	pipe() {
		return wi(this, arguments);
	}
}, Pb = (e) => {
	let t = Object.create(Nb);
	return t.transform = (t, n) => _m(e(t, n), (e) => X(am(e))), t;
}, Fb = (e, t) => Pb((n, r) => Z(Rb(e)(n, r), (e) => t(e, r))), Ib = (e) => Pb((t, n) => e), Lb = (e) => Pb(zm(function* (t, n) {
	let r = vp(n), i = (e) => yp(r, Jp(e));
	return Dm(yield* Dm(e(t, n, r), i), i);
})), Rb = (e) => e.transform, zb = (e, t, n) => eb({
	capacity: n?.bufferSize,
	strategy: n?.strategy
}).pipe(dm((t) => _p(e, ob(t))), dm((n) => Nm(hp(t(n), e), e))), Bb = (e, t) => Pb((n, r) => pm(zb(r, e, t), cb)), Vb = (e) => Ib(X(Am(My(e), () => $f()))), Hb = (e) => Yb(pm(Ay(e), Vb)), Ub = /*#__PURE__*/ I(2, (e, t) => Fb(e, (e) => em(() => {
	let n = 0;
	return pm(e, (e) => t(e, n++));
}))), Wb = (e) => e === void 0 || e !== "unbounded" && e <= 1, Gb = /*#__PURE__*/ I((e) => Mb(e[0]), (e, t, n) => Wb(n?.concurrency) ? Kb(e, t) : qb(e, t, n)), Kb = (e, t) => Pb((n, r) => {
	let i = 0;
	return pm(Rb(e)(n, r), Z((e) => t(e, i++)));
}), qb = (e, t, n) => Lb(zm(function* (r, i, a) {
	let o = 0, s = yield* Rb(e)(r, i), c = n.concurrency === "unbounded" ? 2 ** 53 - 1 : n.concurrency, l = yield* tb(0);
	yield* _p(a, ob(l));
	let u = Im(yield* Cm()), d = oy(a);
	if (n.unordered) {
		let e = Ob(c), n = Di(e.release(1)), r = Sm({
			onFailure: (e) => Z(ib(l, e), n),
			onSuccess: (e) => Z(nb(l, e), n)
		});
		yield* e.take(1).pipe(Z(() => s), Z((e) => {
			let n = o++;
			return d(u(r($p(() => t(e, n))))), tm;
		}), Mm({ disableYield: !0 }), _m((t) => e.withPermits(c - 1)(ib(l, t))), Nm(a));
	} else {
		let e = yield* tb(c - 2);
		yield* _p(a, ob(e)), yield* ub(e).pipe(lm, Z((e) => nb(l, e)), Mm({ disableYield: !0 }), _m((e) => ib(l, e)), Nm(a));
		let n, r = (e) => {
			e._tag !== "Success" && (n = e.cause, ab(l, e.cause));
		};
		yield* s.pipe(Z((i) => {
			if (n) return am(n);
			let a = o++, s = u($p(() => t(i, a)));
			return d(s), s.addObserver(r), nb(e, ay(s));
		}), Mm({ disableYield: !0 }), _m((t) => nb(e, tp(t)).pipe(um(ib(e, t)))), Nm(a));
	}
	return ub(l);
})), Jb = (e) => Fb(e, (e) => {
	let t, n = 0;
	return X($p(function r() {
		if (t === void 0) return Z(e, (e) => {
			switch (e.length) {
				case 0: return r();
				case 1: return X(e[0]);
				default: return t = e, X(e[n++]);
			}
		});
		let i = t[n++];
		return n >= t.length && (t = void 0, n = 0), X(i);
	}));
}), Yb = (e) => Pb((t, n) => {
	let r;
	return X($p(() => r || e.pipe(hp(n), Z((e) => Rb(e)(t, n)), Z((e) => r = e))));
}), Xb = (e, t, n) => $p(() => {
	let r = mp();
	return Up(Z(Rb(e)($f(), r), t), n || X).pipe(Om((e) => yp(r, e)));
}), Zb = /*#__PURE__*/ I(2, (e, t) => Xb(e, (e) => Mm(Z(e, t), { disableYield: !0 }))), Qb = (e, t) => Rb(e)($f(), t), $b = "~effect/Stream", ex = {
	_R: L,
	_E: L,
	_A: L
}, tx = function(e) {
	this.channel = e;
};
tx.prototype = {
	[$b]: ex,
	pipe() {
		return wi(this, arguments);
	}
};
var nx = (e) => new tx(e), rx = "~effect/Stream", ix = (e) => R(e, rx), ax = nx, ox = (e, t) => ax(Pb((n, r) => Z(Qb(e.channel, r), (e) => t(e, r)))), sx = (e, t) => ax(Bb(e, t)), cx = (e) => ax(Hb(e)), lx = /*#__PURE__*/ I((e) => ix(e[0]), (e, t, n) => e.channel.pipe(Jb, Gb(t, n), Ub(yc), ax)), ux = /*#__PURE__*/ I((e) => ix(e[0]), (e, t, n) => lx(e, (e) => mm(t(e), e), n)), dx = /*#__PURE__*/ I(2, (e, t) => ox(e, zm(function* (e, n) {
	let r = yield* Lp, i = Yc(jc(t)), a, o, s = Infinity, c = sy(), l = sy(), u = sy();
	yield* e.pipe(c.whenOpen, Z((e) => (l.openUnsafe(), a = e, s = r.currentTimeMillisUnsafe() + i, tm)), Mm({ disableYield: !0 }), Dm((e) => (o = e, s = r.currentTimeMillisUnsafe(), l.openUnsafe(), u.openUnsafe(), tm)), Nm(n));
	let d = $p(function e() {
		let t = r.currentTimeMillisUnsafe();
		return Z(bm(ym(s < t ? i : Math.min(i, s - t)), u.await), () => {
			if (r.currentTimeMillisUnsafe() < s) return e();
			if (a) {
				l.closeUnsafe(), c.closeUnsafe();
				let e = X(yc(_c(a)));
				return a = void 0, e;
			}
			return o ? am(o) : e();
		});
	});
	return $p(() => {
		if (o) {
			if (a) {
				let e = X(yc(_c(a)));
				return a = void 0, e;
			}
			return am(o);
		}
		return c.openUnsafe(), l.whenOpen(d);
	});
}))), fx = /*#__PURE__*/ I(2, (e, t) => Zb(e.channel, (e) => {
	let n = 0;
	return Qp({
		while: () => n < e.length,
		body: () => t(e[n++]),
		step: ji
	});
})), px = Gf, mx = (e) => U((t) => e(t.getRef(px))), hx = (...e) => mx((t) => K(() => {
	t.error(...e);
})), gx = {
	"~effect/Ref": { _A: L },
	...oo,
	toJSON() {
		return {
			_id: "Ref",
			ref: this.ref
		};
	}
}, _x = (e) => {
	let t = Object.create(gx);
	return t.ref = uy(e), t;
}, vx = (e) => em(() => _x(e)), yx = (e) => em(() => e.ref.current), bx = /*#__PURE__*/ I(2, (e, t) => em(() => dy(e.ref, t))), xx = "~effect/SubscriptionRef", Sx = {
	...oo,
	[xx]: { _A: L },
	toJSON() {
		return {
			_id: "SubscriptionRef",
			value: this.value
		};
	}
}, Cx = (e) => pm(Dy({ replay: 1 }), (t) => {
	let n = Object.create(Sx);
	return n.semaphore = Ob(1), n.value = e, n.pubsub = t, ky(n.pubsub, e), n;
}), wx = (e) => cx(e.pubsub), Tx = (e, t) => {
	e.value = t, ky(e.pubsub, t);
}, Ex = /*#__PURE__*/ I(2, (e, t) => e.semaphore.withPermit(em(() => Tx(e, t)))), Dx = {
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
}, Ox = /^@(media|supports|container|scope|starting-style)\b/i, kx = (e, t) => {
	let n = 0;
	for (let r = t; r < e.length; r++) {
		let t = e[r];
		if (t === "\"" || t === "'") r = Ax(e, r);
		else if (t === "{" || t === "(" || t === "[") n++;
		else if ((t === "}" || t === ")" || t === "]") && --n === 0) return r + 1;
	}
	return e.length;
}, Ax = (e, t) => {
	for (let n = t + 1; n < e.length; n++) if (e[n] === "\\") n++;
	else if (e[n] === e[t]) return n;
	return e.length;
}, jx = (e, t) => {
	let n = [], r = 0, i = 0;
	for (let a = 0; a < e.length; a++) {
		let o = e[a];
		o === "\"" || o === "'" ? a = Ax(e, a) : o === "(" || o === "[" || o === "{" ? r++ : o === ")" || o === "]" || o === "}" ? r-- : o === t && r === 0 && (n.push(e.slice(i, a)), i = a + 1);
	}
	return n.push(e.slice(i)), n.flatMap((e) => e.trim() ? [e.trim()] : []);
}, Mx = (e) => jx(e, ";").flatMap((e) => {
	let t = e.indexOf(":");
	if (t <= 0) return [];
	let n = e.slice(0, t).trim(), r = e.slice(t + 1).trim(), i = /!\s*important$/i.test(r);
	return i && (r = r.replace(/\s*!\s*important$/i, "")), [{
		prop: n.startsWith("--") ? n : n.toLowerCase(),
		value: r,
		important: i
	}];
}), Nx = (e, t, n, r) => {
	let i = 0;
	for (; i < e.length;) {
		for (; i < e.length && /\s/.test(e[i]);) i++;
		if (i >= e.length) return;
		let a = i;
		for (; a < e.length && e[a] !== "{" && e[a] !== ";";) {
			let t = e[a];
			a = t === "\"" || t === "'" ? Ax(e, a) + 1 : t === "(" || t === "[" ? kx(e, a) : a + 1;
		}
		let o = e.slice(i, a).trim();
		if (a >= e.length || e[a] === ";") {
			i = a + 1;
			continue;
		}
		let s = kx(e, a), c = e.slice(a + 1, s - 1);
		if (i = s, /^@layer\b/i.test(o)) {
			let e = o.slice(6).trim();
			Nx(c, t ? `${t}.${e}` : e, n, r);
		} else if (Ox.test(o)) Nx(c, t, [...n, o], r);
		else if (/^@property\b/i.test(o)) {
			let e = Mx(c).find((e) => e.prop === "inherits");
			r.inherits.set(o.slice(9).trim(), e?.value.trim() !== "false");
		} else if (o.startsWith("@")) continue;
		else {
			let e = c.replace(/[^;{}]*\{[^]*\}/g, "");
			r.rules.push({
				index: r.rules.length,
				layer: t,
				wrap: n,
				selector: o,
				decls: Mx(e)
			});
		}
	}
}, Px = Bm("devtools.parseSheet")(function* (e) {
	return yield* em(() => {
		let t = {
			rules: [],
			inherits: /* @__PURE__ */ new Map()
		};
		return Nx(e.replace(/\/\*[^]*?\*\//g, ""), "", [], t), t;
	});
}), Fx = [
	0,
	0,
	0
], Ix = (e, t) => [
	e[0] + t[0],
	e[1] + t[1],
	e[2] + t[2]
], Lx = (e, t) => e[0] - t[0] || e[1] - t[1] || e[2] - t[2], Rx = (e) => e.reduce((e, t) => Lx(t, e) > 0 ? t : e, Fx), zx = /^-?[\w-]+/, Bx = /^(is|not|has|matches)$/i, Vx = (e) => {
	let t = [
		0,
		0,
		0
	];
	for (let n = 0; n < e.length;) {
		let r = e[n], i = e.slice(n + 1);
		if (r === "#") t = Ix(t, [
			1,
			0,
			0
		]), n += 1 + (zx.exec(i)?.[0].length ?? 0);
		else if (r === ".") t = Ix(t, [
			0,
			1,
			0
		]), n += 1 + (zx.exec(i)?.[0].length ?? 0);
		else if (r === "[") t = Ix(t, [
			0,
			1,
			0
		]), n = kx(e, n);
		else if (r === ":") {
			let r = e[n + 1] === ":", i = n + (r ? 2 : 1), a = zx.exec(e.slice(i))?.[0] ?? "", o = i + a.length, s = e[o] === "(" ? e.slice(o + 1, kx(e, o) - 1) : void 0;
			s !== void 0 && (o = kx(e, o)), t = r ? Ix(t, [
				0,
				0,
				1
			]) : /^where$/i.test(a) ? Ix(t, Fx) : Bx.test(a) && s !== void 0 ? Ix(t, Rx(jx(s, ",").map(Vx))) : Ix(t, [
				0,
				1,
				0
			]), n = o;
		} else /[a-zA-Z]/.test(r) ? (t = Ix(t, [
			0,
			0,
			1
		]), n += zx.exec(e.slice(n))?.[0].length ?? 1) : n++;
	}
	return t;
}, Hx = /^(where|is|not|has|root|scope|host|first-child|last-child|only-child|first-of-type|last-of-type|only-of-type|empty|defined|nth-child|nth-last-child|nth-of-type|nth-last-of-type)$/i, Ux = (e, t = !1) => {
	let n = "", r = [];
	for (let i = 0; i < e.length;) {
		let a = e[i];
		if (a === "[") {
			let n = kx(e, i);
			r.push(`${t ? "within " : ""}${e.slice(i, n)}`), i = n;
		} else if (a === ":" && e[i + 1] !== ":") {
			let a = zx.exec(e.slice(i + 1))?.[0] ?? "", o = i + 1 + a.length, s = e[o] === "(", c = s ? kx(e, o) : o;
			if (Hx.test(a)) {
				if (s && /^(where|is|not|has)$/i.test(a)) {
					let i = jx(e.slice(o + 1, c - 1), ",").map((e) => Ux(e, t || /^where$/i.test(a)));
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
}, Wx = class extends Ts()("@cssints/devtools/core/page") {}, Gx = (e) => Dx[e] ?? [e], Kx = (e) => /^@scope\b/i.test(e), qx = /\._[\w-]/, Jx = 1e9, Yx = /^(width|height|inline-size|block-size|min-width|min-height|max-width|max-height|flex-basis|grid-template-columns|grid-template-rows)$/, Xx = (e, t) => t === "" ? Jx : e.rank.get(t) ?? e.rank.get(t.split(".")[0]) ?? -1, Zx = (e, t, n) => {
	if (t.decl.important !== n.decl.important) return t.decl.important;
	let r = Xx(e, t.layer), i = Xx(e, n.layer);
	return ((t.decl.important ? i - r : r - i) || Lx(t.specificity, n.specificity) || t.rule - n.rule) > 0;
}, Qx = zm(function* (e, t, n) {
	let r = yield* Wx, i = e.sheet.rules.filter((e) => e.decls.length && (!n || e.decls.some((e) => e.prop === n))), a = (e) => jx(e.selector, ",").map((e) => ({
		full: e,
		...qx.test(e) ? Ux(e) : {
			base: e,
			states: []
		}
	})), o = i.filter((e) => e.wrap.some(Kx)), s = o.flatMap((e) => {
		let t = e.wrap.filter(Kx);
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
				specificity: n.map((e) => Vx(e.full)).reduce((e, t) => Lx(t, e) > 0 ? t : e),
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
		let d = (u.length ? u : s).map((e) => Vx(e.full));
		l.push({
			rule: e,
			specificity: d.reduce((e, t) => Lx(t, e) > 0 ? t : e),
			matched: u.length > 0,
			states: s.flatMap((e) => e.states)
		});
	}
	let u = [...new Set(l.flatMap((e) => e.rule.wrap.filter((e) => !Kx(e))))], d = yield* r.probe(t, u.map((e) => ({ wrap: [e] }))), f = new Map(u.map((e, t) => [e, !!d[t]]));
	return l.flatMap(({ rule: e, specificity: t, matched: r, states: i }) => {
		let a = [...e.wrap.map((e) => ({
			text: e,
			holds: Kx(e) || !!f.get(e)
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
}), $x = (e, t, n) => {
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
	} : Yx.test(e.prop) ? {
		...r,
		status: "unverified",
		reason: `${e.prop} depends on the element's content and layout, which the probe does not have`
	} : {
		...r,
		status: "mismatch",
		reason: `the browser computes ${e.computed}; ${t.selector} would give ${e.expected}`
	};
}, eS = zm(function* (e, t, n) {
	let r;
	for (let i of yield* Qx(e, t, n)) i.applies && (!r || Zx(e, i, r)) && (r = i);
	return r;
}), tS = zm(function* (e, t, n) {
	let r = yield* Wx, i = e.sheet.inherits.get(n) ?? !0, a = t;
	for (let t = 0; a && t < 64; t++) {
		let t = yield* eS(e, a, n);
		if (t) return {
			selector: t.selector,
			layer: t.layer,
			wrap: t.wrap,
			on: yield* r.label(a)
		};
		if (!i) return;
		a = yield* r.parent(a);
	}
}), nS = /var\(\s*(--[\w-]+)/g, rS = Bm("devtools.inspect")(function* (e, t) {
	let n = yield* Wx, { table: r } = e, i = yield* Qx(e, t), a = i.filter((e) => e.applies), o = i.filter((e) => !e.applies), s = /* @__PURE__ */ new Map();
	for (let t of a) for (let n of Gx(t.decl.prop)) {
		let r = s.get(n);
		(!r || Zx(e, t, r)) && s.set(n, t);
	}
	let c = /* @__PURE__ */ new Map();
	for (let [e, t] of s) (c.get(t) ?? c.set(t, []).get(t)).push(e);
	let l = (e, t) => Gx(e.decl.prop).some((e) => t.includes(e)), u = [];
	for (let [e, i] of c) {
		let c = (yield* n.verify(t, e.decl.prop, e.selector, e.decl.value, i)).map((t) => $x(t, e, r.root));
		u.push({
			prop: e.decl.prop,
			longhands: i,
			winner: e,
			lost: Gx(e.decl.prop).flatMap((t) => {
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
	for (let e of o) Gx(e.decl.prop).some((e) => s.has(e)) || (d.get(e.decl.prop) ?? d.set(e.decl.prop, []).get(e.decl.prop)).push(e);
	for (let [e, t] of d) u.push({
		prop: e,
		longhands: [...Gx(e)],
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
		let i = n.kind === "class" ? e.rulesOf.get(t) ?? [] : [], a = i.flatMap((e) => p.get(e) ?? []), o = i[0] === void 0 ? void 0 : e.sheet.rules[i[0]], s = o ? jx(o.selector, ",").flatMap((e) => Ux(e).states) : [];
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
	let ee = [.../* @__PURE__ */ new Set([...i.flatMap((e) => [...e.decl.value.matchAll(nS)].map((e) => e[1])), ...f.flatMap((e) => r.classes[e]?.tokens ?? [])])].sort(), v = yield* n.custom(t, ee), te = [];
	for (let [n, i] of ee.entries()) {
		let a = r.tokens[i], o = yield* tS(e, t, i);
		te.push({
			name: i,
			...a ? {
				path: a.path,
				declared: a.value
			} : {},
			computed: v[n] ?? "",
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
}), iS = "data-cssints-probe", aS = (e) => e.ownerNode instanceof Element && (e.ownerNode.getAttribute("data-vite-dev-id") ?? "").endsWith("virtual:cssints.css"), oS = (e, t) => uc(cc(() => e.matches(t)), () => !1), sS = (e) => {
	let t = [...e.attributes].find((e) => e.name.startsWith("data-") && e.name !== iS);
	return `${e.localName}${e.id ? `#${e.id}` : ""}${t ? `[${t.name}${t.value ? `="${t.value}"` : ""}]` : ""}`;
}, cS = (e, t) => {
	if (!t.length) return [];
	let n = e.ownerDocument.createElement("style");
	n.textContent = t.map(({ wrap: e, selector: t }, n) => {
		let r = t ? `:is(${t}):where([${iS}])` : `[${iS}]`;
		return `${e.map((e) => `${e} {`).join(" ")} ${r} { --cssints-probe-${n}: 1 } ${"}".repeat(e.length)}`;
	}).join("\n"), e.ownerDocument.head.append(n), e.setAttribute(iS, "");
	let r = getComputedStyle(e), i = t.map((e, t) => r.getPropertyValue(`--cssints-probe-${t}`).trim() === "1");
	return e.removeAttribute(iS), n.remove(), i;
}, lS = (e, t) => {
	let n = [], r = e.ownerDocument.defaultView, i = (a, o, s) => {
		for (let c of a) if (c instanceof CSSStyleRule) {
			let r = c.style.getPropertyValue(t);
			r && oS(e, c.selectorText) && n.push({
				selector: c.selectorText,
				source: o,
				layer: s,
				value: r,
				important: c.style.getPropertyPriority(t) === "important"
			}), i(c.cssRules, o, s);
		} else c instanceof CSSLayerBlockRule ? i(c.cssRules, o, s ? `${s}.${c.name}` : c.name) : c instanceof CSSMediaRule ? r?.matchMedia(c.conditionText).matches && i(c.cssRules, o, s) : c instanceof CSSSupportsRule ? CSS.supports(c.conditionText) && i(c.cssRules, o, s) : c instanceof CSSGroupingRule && i(c.cssRules, o, s);
	};
	for (let t of e.ownerDocument.styleSheets) {
		if (aS(t)) continue;
		let e = t.ownerNode instanceof Element ? t.ownerNode : void 0, n = t.href ?? e?.getAttribute("data-vite-dev-id") ?? `<${e?.localName ?? "style"}>`, r = dc(cc(() => t.cssRules));
		r && i(r, n, "");
	}
	return n;
}, uS = (e) => dc(cc(() => {
	let t = new CSSStyleSheet();
	t.insertRule(`${e} {}`);
	let n = t.cssRules[0];
	return n instanceof CSSStyleRule ? n.selectorText : void 0;
})), dS = (e, t, n) => {
	let r = uS(t);
	if (r === void 0) return;
	let i = [], a = (e, t) => {
		for (let o of e) if (o instanceof CSSStyleRule) {
			let e = o.style.getPropertyValue(n);
			e && o.selectorText === r && i.push({
				wrap: t,
				value: e
			});
		} else o instanceof CSSMediaRule ? a(o.cssRules, [...t, `@media ${o.conditionText}`]) : o instanceof CSSSupportsRule ? a(o.cssRules, [...t, `@supports ${o.conditionText}`]) : o instanceof CSSContainerRule ? a(o.cssRules, [...t, `@container ${o.conditionText}`]) : globalThis.CSSScopeRule && o instanceof CSSScopeRule ? a(o.cssRules, [...t, `@scope${o.start ? ` (${o.start})` : ""}${o.end ? ` to (${o.end})` : ""}`]) : o instanceof CSSGroupingRule && a(o.cssRules, t);
	}, o = [...e.ownerDocument.styleSheets], s = o.filter(aS);
	for (let e of s.length ? s : o) {
		let t = dc(cc(() => e.cssRules));
		t && a(t, []);
	}
	if (i.length < 2) return i[0]?.value;
	let c = cS(e, i.map(({ wrap: e }) => ({ wrap: e })));
	return i.findLast((e, t) => c[t])?.value ?? i.at(-1).value;
}, fS = /var\(\s*(--[\w-]+)/g, pS = (e, t, n, r, i) => {
	let a = e.cloneNode(!1);
	if (!(a instanceof Element) || !(a instanceof HTMLElement || a instanceof SVGElement)) return [];
	let o = t.startsWith("--") && dS(e, n, t) || r, s = getComputedStyle(e);
	for (let [, e] of o.matchAll(fS)) a.style.setProperty(e, s.getPropertyValue(e));
	a.style.setProperty(t, o, "important"), e.after(a);
	let c = getComputedStyle(a), l = e instanceof HTMLElement || e instanceof SVGElement ? e.style : void 0, u = e.getAnimations().length > 0, d = i.map((t) => {
		let n = s.getPropertyValue(t).trim(), r = c.getPropertyValue(t).trim();
		return {
			prop: t,
			computed: n,
			expected: r,
			inline: l?.getPropertyValue(t) ?? "",
			foreign: n === r ? [] : lS(e, t),
			animated: u
		};
	});
	return a.remove(), d;
}, mS = Np(Wx, Wx.of({
	classes: (e) => em(() => [...e.classList]),
	label: (e) => em(() => sS(e)),
	parent: (e) => em(() => e.parentElement ?? void 0),
	matches: (e, t) => em(() => oS(e, t)),
	probe: (e, t) => em(() => cS(e, t)),
	custom: (e, t) => em(() => {
		let n = getComputedStyle(e);
		return t.map((e) => n.getPropertyValue(e).trim());
	}),
	verify: (e, t, n, r, i) => em(() => pS(e, t, n, r, i))
})), hS = 8, gS = 24, _S = 3, vS = 12, yS = 400, bS = (e, t) => t.startsWith(`${e}/`) ? t.slice(e.length + 1) : t, xS = (e, t) => e.length > t ? `${e.slice(0, t)}…` : e, SS = (e) => (e ?? "").replace(/\s+/g, " ").trim(), CS = (e) => {
	let t = e.parentElement, n = t?.parentElement;
	return [
		n?.parentElement,
		n,
		t,
		e
	].flatMap((e) => e ? [`${e.localName}${e.id ? `#${e.id}` : ""}`] : []).join(" > ");
}, wS = (e) => `${e.selector} (${e.layer || "unlayered"})`, TS = (e, t) => [
	"Change the UI of the running app as the instruction says.",
	"The styles are written with cssints (`css.*` calls): edit those calls, not the generated class names.",
	"",
	`Instruction: ${e.trim()}`,
	"",
	`Page: ${t}`
].join("\n"), ES = (e, t, n) => {
	let { root: r } = e, i = e.groups.flatMap((e) => e.site ? [e.site] : []), a = [
		"Change the UI of the running app as the instruction says.",
		"The styles are written with cssints: each `css.*` call below produced the classes of the element,",
		"so edit those calls (or the markup that uses them), not the generated class names.",
		"",
		`Instruction: ${n.trim()}`,
		"",
		`Element: <${e.element}>`,
		`DOM path: ${CS(t)}`,
		`Text: ${xS(SS(t.textContent), 120) || "(none)"}`,
		`Classes: ${[...t.classList].slice(0, 12).join(" ") || "(none)"}`,
		"",
		"Styled by (file:line, the call as written):"
	];
	i.length || a.push("- no cssints call: the element is styled elsewhere");
	for (let e of i.slice(0, hS)) a.push(`- ${bS(r, e.file)}:${e.line}`, `  ${xS(SS(e.text ?? ""), yS)}`);
	i.length > hS && a.push(`- … and ${i.length - hS} more`), a.push("", "Properties now (the winner, then what it beat):");
	for (let t of e.rows.slice(0, gS)) {
		if (!t.winner) continue;
		let e = t.winner, n = t.overridden.slice(0, _S).map((e) => `${e.decl.prop}: ${e.decl.value} ${wS(e)}`);
		a.push(`- ${e.decl.prop}: ${e.decl.value}${e.decl.important ? " !important" : ""} from ${wS(e)}` + (n.length ? `; overridden: ${n.join("; ")}` : ""));
	}
	if (e.rows.length > gS && a.push(`- … and ${e.rows.length - gS} more`), e.tokens.length) {
		a.push("", "Tokens it reads:");
		for (let t of e.tokens.slice(0, vS)) a.push(`- ${t.name} = ${t.computed || "(not set)"}${t.path ? ` (${t.path})` : ""}`);
	}
	return a.join("\n");
}, DS = Zv({
	file: Yv,
	line: iy,
	column: iy,
	classes: $v(Yv),
	text: qv(Yv)
}), OS = Zv({
	kind: ny([
		"class",
		"marker",
		"group"
	]),
	layer: Yv,
	wrap: $v(Yv),
	prop: Yv,
	css: Yv,
	tokens: $v(Yv),
	plugin: qv(Yv),
	sites: $v(iy)
}), kS = Zv({
	root: Yv,
	sheet: Yv,
	layers: $v(Yv),
	classes: Qv(Yv, OS),
	sites: $v(DS),
	tokens: Qv(Yv, Zv({
		path: Yv,
		value: Yv
	}))
}), AS = class extends ul("TableError") {}, jS = Bm("devtools.toModel")(function* (e) {
	let t = yield* Gv(kS)(e).pipe(vm((e) => new AS({ message: `cssints devtools: a bad table: ${e.message}` }))), n = yield* Px(t.sheet), r = new Map(t.layers.map((e, t) => [e, t])), i = /* @__PURE__ */ new Map();
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
}), MS = "cssints:devtools", NS = "cssints:devtools:stale", PS = "cssints:devtools:asked", FS = "cssints:devtools:linked", IS = class extends Ts()("@cssints/devtools/core/session/Transport") {}, LS = (e, t) => sx((n) => em(() => e.on(t, (e) => rb(n, e)))), RS = Bm("devtools.session")(function* () {
	let e = yield* IS, t = yield* Cx(void 0), n = yield* vx(!1), r = yield* vx(!0), i = bx(r, !1).pipe(um(em(() => e.request()))), a = rm(function* () {
		(yield* yx(n)) && (yield* yx(r)) && (yield* i);
	});
	return yield* Pm(fx(LS(e, MS), (e) => jS(e).pipe(Z((e) => Ex(t, e)), gm("TableError", (e) => hx(e.message))))), yield* Pm(fx(LS(e, NS).pipe(ux(() => bx(r, !0)), dx("60 millis")), () => a)), {
		model: t,
		setActive: (e) => bx(n, e).pipe(um(a))
	};
}), zS = "#111827", BS = "_1hqog5g _df4eqw _1vbyxpb _120vnyk _1t8gqy5 _1nu71z9 _14o2sa1 _1a8gflu _fjx7jy _16hpt8q _6to0fc _1lwcmvy _s7rk0y _1gqyter", VS = "_1hqog5g _120vnyj _z3zdsi _13tqlfe _1ecomh", HS = "_1f14wpf _rhyb7t _33i4pm _i1h5ry _1dh9zox _1h4s3ko _16hpt8q _6to0fc _184nt68", US = "_1njigwa", WS = "_1g5d2ic", GS = "_4k81c2 _jveril _rv7stg _z6zrz5", KS = "_4k81c2 _33i4pm _rv7stg _e3rhh0", qS = "_4k81c2 _33i4pm _jveril _1fskg2z", JS = "_4k81c2 _33i4pm _jveril _rv7stg", YS = "_rv7stg _33i4pm _jveril _1pkekbt", XS = "_1hqog5g _120vnyk _1pan41p _4k81c2 _rv7stg _arb16l _2cr60o", ZS = "_1hqog5g _120vnyk _1pan41p _33i4pm _jveril _1b2tqpi _v11v3x", QS = "_1s47490 _1njigwa _1wme27f _uysq8p _1egbj28", $S = "_1wme27f _uysq8p _r0xwy4", eC = "_1s47490 _1ob5z5m _g2iyum _baxxsq _1t8gqy5 _1a8gflu _1fskg2z", tC = "_1wme27f _16hpt8q _1i8j81t", nC = "_i1h7gg _1kazld4 _14o2sa1 _k0i4ku _v4t4nx _fjx7jy _n5igo9 _1lwcmvy _1gmfivd", rC = "_1t8gqy5 _1fskg2z", iC = "_1q2li77 _6to0fc _17lglqt _n5339z _1n07ta0", aC = "_1jvfuo0 _g9h8t5 _v4i8ee _m367sd _v4t4nx _1k2b3pg _16hpt8q _6to0fc _1lwcmvy _1gt2bai _hyivqx", oC = "_16hpt8q _6to0fc _g9cs3h _1jjinuh _lqk467 _1waot2e _r0xwy4 _1ajqzk5 _tnb0cg", sC = "_1jvfuo0 _g9h8t5 _1k2b3pg _16hpt8q _6to0fc", cC = "_1n07ta0", lC = "_1kazn1m _1p6y9cw", uC = "_1s47490 _138gorg _g2iyum _16hpt8q", dC = "_g9ymq9 _6to0fc", fC = "_1wme27f _6to0fc _g9cs3h", pC = "_k9k5db _1n07ta0", mC = "_u6js88 _16hpt8q _6to0fc", hC = "_1lh9g66", gC = "_h3m4ra", _C = "_h3od5l", vC = "_u6js88 _h3m4ra _6to0fc", yC = "_1t8gqy5 _1n07ta0", bC = "_1pkekbt", xC = "_1uu2qw5 _z6zrz5", SC = "_1s47490 _1ob5z5m _g2iyum", CC = "_1wme27f _6to0fc _1i8j81t _17lglqt _n5339z _1n07ta0", wC = "_1ew8c5n", TC = "_1gf6p9h", EC = /* @__PURE__ */ j("<span>"), DC = /* @__PURE__ */ j("<div class=\"_u6js88 _16hpt8q _6to0fc _1n07ta0\">except "), OC = /* @__PURE__ */ j("<div><div><span></span><!><!></div><!><!><!><!><!>"), kC = /* @__PURE__ */ j("<span class=\"_1wme27f _6to0fc _g9cs3h _1n07ta0\">nothing applies now"), AC = /* @__PURE__ */ j("<span><!><!>"), jC = /* @__PURE__ */ j("<div><span></span> "), MC = /* @__PURE__ */ j("<div><span>: <!></span> <span>"), NC = /* @__PURE__ */ j("<div class=\"_u6js88 _16hpt8q _6to0fc _1c7it6z\">: <!> <span></span> <!>"), PC = /* @__PURE__ */ j("<div>"), FC = /* @__PURE__ */ j("<div data-devtools=classes><h3>Classes by call"), IC = /* @__PURE__ */ j("<div data-devtools=properties><h3>Properties"), LC = /* @__PURE__ */ j("<div data-devtools=tokens><h3>Tokens"), RC = /* @__PURE__ */ j("<div><!><!>"), zC = /* @__PURE__ */ j("<div>no cssints call"), BC = /* @__PURE__ */ j("<button>:<!> ↗"), VC = /* @__PURE__ */ j("<pre data-call>"), HC = /* @__PURE__ */ j("<div>:<!>"), UC = /* @__PURE__ */ j("<div><span>.</span><span><!> <!></span><span>"), WC = /* @__PURE__ */ j("<div><div><span></span><span></span><span>"), GC = /* @__PURE__ */ j("<div class=\"_u6js88 _16hpt8q _6to0fc _1n07ta0\">"), KC = /* @__PURE__ */ j("<div class=\"_u6js88 _16hpt8q _6to0fc _1n07ta0\">from <!> <!> <!> on <!>"), qC = /* @__PURE__ */ j("<div data-devtools=blocked>The browser blocked the window. Allow pop-ups for this site and press ⧉ again."), JC = /* @__PURE__ */ j("<div data-devtools=ask><div><span data-devtools=ask-title>OpenCode</span><span class=\"_16hpt8q _6to0fc _g9cs3h _1n07ta0\"data-devtools=ask-link><span></span> </span></div><textarea data-devtools=ask-input rows=2></textarea><div class=\"_16hpt8q _6to0fc _g9cs3h _1n07ta0\"data-devtools=ask-status>"), YC = /* @__PURE__ */ j("<aside data-devtools=panel><div><div data-devtools=bar><span data-devtools=element></span><button data-devtools=pick title=\"pick an element\">pick</button><button data-devtools=detach>⧉</button><button title=\"parent (↑)\">↑</button><button data-devtools=close title=\"close (Esc)\">×</button></div><div data-devtools=body>"), XC = /* @__PURE__ */ j("<div data-devtools=grip>"), ZC = /* @__PURE__ */ j("<button data-devtools=dock>"), QC = /* @__PURE__ */ j("<span data-devtools=ask-session>"), $C = /* @__PURE__ */ j("<span data-devtools=ask-state>"), ew = /* @__PURE__ */ j("<button data-devtools=toggle title=\"cssints devtools (Alt+Shift+C)\">cssints"), tw = /* @__PURE__ */ j("<div><span>"), nw = "@layer _.k{*{box-sizing:border-box}}@layer _.a{._n5igo9{font:inherit}._14o2sa1{border:1px solid #374151}._m367sd{border:none}._1jjinuh{margin:0 0 4px}._1nu71z9{border-radius:999px}._1t8gqy5{padding:.5rem}._99b8e4{border-color:#16a34a}._k0i3ql{border-radius:3px}._k0i4ku{border-radius:4px}._k9k5db{text-decoration:line-through}._lqk467{padding:.25rem}._v4i8ee{padding:0}._13tqlfe{outline:2px solid #60a5fa}._1fskg2z{border-bottom:1px solid #374151}._1p6y9cw{border-top:1px solid #1f2937}._1pkekbt{border-top:1px solid #374151}._e3rhh0{border-right:1px solid #374151}._z6zrz5{border-left:1px solid #374151}._184nt68{white-space:nowrap}._1kazkiv{padding-block:1px}._1kazld4{padding-block:2px}._1kazn1m{padding-block:4px}._1q2li77{margin-block:0 6px}._g2iyum{gap:.5rem}._i1h5ry{padding-inline:4px}._i1h7gg{padding-inline:6px}._r0xwy4{overflow:auto}._szl2in{overflow:hidden}._tnb0cg{white-space:pre}._x06mdc{gap:.25rem}._120vnyj{z-index:2147483646}._120vnyk{z-index:2147483647}._138gorg{align-items:baseline}._16hpt8q{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}._17lglqt{text-transform:uppercase}._1a8gflu{background-color:#111827}._1ajqzk5{background-color:#0b1220}._1b2tqpi{height:6px}._1b2tse0{height:8px}._1c7it6z{opacity:.5}._1cl1tpz{grid-template-columns:auto 1fr auto}._1dh9zox{background-color:#60a5fa}._1ecomh{background-color:#60a5fa1f}._1egbj28{min-width:0}._1ew8c5n{background-color:#86efac}._1f14wpf{position:absolute}._1g5d2ic{flex-direction:row}._1gf6p9h{background-color:#9ca3af}._1gt2bai{text-align:start}._1h4s3ko{color:#0b1220}._1hjgerl{resize:none}._1hqog5g{position:fixed}._1i8j81t{font-weight:600}._1jvfuo0{display:block}._1k2b3pg{color:#60a5fa}._1lh9g66{color:#86efac}._1lwcmvy{cursor:pointer}._1n07ta0{color:#9ca3af}._1njigwa{flex-direction:column}._1ob5z5m{align-items:center}._1pan41p{touch-action:none}._1s47490{display:flex}._1s4813v{display:grid}._1uu2qw5{width:20rem}._1vbyxpb{bottom:12px}._1waot2e{max-height:120px}._1wme27f{flex-grow:1}._1ywigwl{width:100%}._2cr60o{cursor:ew-resize}._33i4pm{left:0}._4k81c2{top:0}._5x4zpc{min-height:3rem}._6tnzl3{font-size:10px}._6to0fc{font-size:11px}._6to19l{font-size:12px}._arb16l{width:6px}._arb2v3{width:8px}._baxxsq{flex-shrink:0}._df4eqw{right:12px}._dnf785{line-height:1.45}._fjx7jy{color:#e5e7eb}._g9cs3h{overflow-wrap:anywhere}._g9h8t5{margin-bottom:2px}._g9ymq9{color:#f9a8d4}._h3m4ra{color:#fca5a5}._h3od5l{color:#fcd34d}._jveril{right:0}._n5339z{letter-spacing:.06em}._n7bsss{display:inline-block}._oir30p{margin-inline-end:4px}._omr8bg{font-family:system-ui,sans-serif}._rhyb7t{top:-20px}._rv7stg{bottom:0}._s7rk0y{opacity:.75}._u6js88{padding-inline-start:12px}._uysq8p{min-height:0}._v11v3x{cursor:ns-resize}._v4t4nx{background-color:#0000}._z3zdsi{pointer-events:none}}@layer _.b{._1gmfivd:hover{border-color:#60a5fa}._hyivqx:hover{text-decoration:underline}._1gqyter:hover{opacity:1}}@layer _.c,_.d,_.e;\n/*$vite$:1*/", rw = "cssints-devtools", iw = [
	"left",
	"top",
	"bottom",
	"right"
], aw = {
	left: "◧",
	top: "⬒",
	bottom: "⬓",
	right: "◨"
}, ow = {
	left: KS,
	top: qS,
	bottom: YS,
	right: GS
}, sw = "cssints-devtools:dock", cw = 200, lw = () => {
	try {
		return JSON.parse(localStorage.getItem(sw) ?? "null");
	} catch {
		return null;
	}
}, uw = () => {
	let e = lw(), t = (e, t) => typeof e == "number" && e >= cw ? e : t;
	return {
		dock: iw.find((t) => t === e?.dock) ?? "right",
		w: t(e?.w, 440),
		h: t(e?.h, 320),
		detached: e?.detached === !0
	};
}, dw = (e) => {
	try {
		localStorage.setItem(sw, JSON.stringify(e));
	} catch {}
}, fw = (e, t) => {
	let n = Rm(rS(e, t).pipe(Tm(mS)));
	return ip(n) ? n.value : String(n.cause);
}, pw = (e, t, n) => void fetch(`/__open-in-editor?file=${encodeURIComponent(`${e}:${t}:${n + 1}`)}`), mw = (e) => O(Mr, {
	get each() {
		return e.of;
	},
	children: (e) => (() => {
		var t = EC();
		return F(t, () => e.text), A(() => ({
			e: P(Ci([], "_n7bsss _oir30p _i1h5ry _k0i3ql _14o2sa1 _16hpt8q _6tnzl3", e.holds && "_99b8e4 _1lh9g66")),
			t: e.holds ? "holds now" : "does not hold now"
		}), ({ e, t: n }, r) => {
			N(t, e, r?.e), n !== r?.t && M(t, "title", n);
		}), t;
	})()
}), hw = (e) => `${e.selector}  ${e.layer || "unlayered"}`;
function gw(e) {
	let t = () => {
		let t = e.row.verdicts;
		return t.find((e) => e.status === "mismatch") ?? t.find((e) => e.status === "unverified") ?? t[0];
	};
	var n = OC(), r = n.firstChild, i = r.firstChild, a = i.nextSibling, o = a.nextSibling, s = r.nextSibling, c = s.nextSibling, l = c.nextSibling, u = l.nextSibling, d = u.nextSibling;
	return F(i, () => e.row.prop), F(r, O(k, {
		get when() {
			return e.row.winner;
		},
		get fallback() {
			return kC();
		},
		children: (e) => (() => {
			var t = AC(), n = t.firstChild, r = n.nextSibling;
			return F(t, () => e().decl.value, n), F(t, () => e().decl.important ? " !important" : "", r), A(() => ({
				e: P(fC),
				t: e().selector,
				a: e().decl.value
			}), ({ e, t: n, a: r }, i) => {
				N(t, e, i?.e), n !== i?.t && M(t, "data-winner", n), r !== i?.a && M(t, "data-value", r);
			}), t;
		})()
	}), a), F(r, O(k, {
		get when() {
			return t();
		},
		children: (e) => (() => {
			var t = EC();
			return F(t, (() => {
				var t = Rr(() => e().status === "ok");
				return () => t() ? "✓" : e().status === "mismatch" ? "✗" : "?";
			})()), A(() => ({
				e: P(e().status === "ok" ? hC : e().status === "mismatch" ? gC : _C),
				t: e().reason ?? `computed ${e().computed}`,
				a: e().computed
			}), ({ e, t: n, a: r }, i) => {
				N(t, e, i?.e), n !== i?.t && M(t, "title", n), r !== i?.a && M(t, "data-computed", r);
			}), t;
		})()
	}), o), F(n, O(k, {
		get when() {
			return e.row.winner;
		},
		children: (e) => (() => {
			var t = jC(), n = t.firstChild;
			return n.nextSibling, F(n, () => hw(e())), F(t, O(mw, { get of() {
				return e().conditions;
			} }), null), A(() => ({
				e: P(mC),
				t: P(cC)
			}), ({ e, t: r }, i) => {
				N(t, e, i?.e), N(n, r, i?.t);
			}), t;
		})()
	}), s), F(n, O(k, {
		get when() {
			return e.row.lost.length;
		},
		get children() {
			var t = DC();
			return t.firstChild, F(t, () => e.row.lost.map((e) => `${e.prop} (${e.by.selector})`).join(", "), null), t;
		}
	}), c), F(n, O(Mr, {
		get each() {
			return e.row.overridden;
		},
		children: (e) => (() => {
			var t = MC(), n = t.firstChild, r = n.firstChild, i = r.nextSibling, a = n.nextSibling.nextSibling;
			return F(n, () => e.decl.prop, r), F(n, () => e.decl.value, i), F(a, () => hw(e)), A(() => ({
				e: P(mC),
				t: e.selector,
				a: P(pC),
				o: P(cC)
			}), ({ e, t: r, a: i, o }, s) => {
				N(t, e, s?.e), r !== s?.t && M(t, "data-overridden", r), N(n, i, s?.a), N(a, o, s?.o);
			}), t;
		})()
	}), l), F(n, O(Mr, {
		get each() {
			return e.row.inactive;
		},
		children: (e) => (() => {
			var t = NC(), n = t.firstChild, r = n.nextSibling, i = r.nextSibling.nextSibling, a = i.nextSibling.nextSibling;
			return F(t, () => e.decl.prop, n), F(t, () => e.decl.value, r), F(i, () => hw(e)), F(t, O(mw, { get of() {
				return e.conditions;
			} }), a), A(() => ({
				e: e.selector,
				t: P(cC)
			}), ({ e, t: n }, r) => {
				e !== r?.e && M(t, "data-inactive", e), N(i, n, r?.t);
			}), t;
		})()
	}), u), F(n, O(Mr, {
		get each() {
			return e.row.verdicts.filter((e) => e.reason);
		},
		children: (e) => (() => {
			var t = PC();
			return F(t, () => e.reason), A(() => P(e.status === "mismatch" ? vC : "_u6js88 _16hpt8q _6to0fc _h3od5l"), (e, n) => {
				N(t, e, n);
			}), t;
		})()
	}), d), A(() => ({
		e: P(lC),
		t: e.row.prop,
		a: t()?.status ?? "none",
		o: P(uC),
		i: P(dC)
	}), ({ e, t, a, o, i: s }, c) => {
		N(n, e, c?.e), t !== c?.t && M(n, "data-prop", t), a !== c?.a && M(n, "data-status", a), N(r, o, c?.o), N(i, s, c?.i);
	}), n;
}
var _w = (e, t) => e === t || JSON.stringify(e) === JSON.stringify(t);
function vw(e) {
	let t = () => e.inspection;
	return [
		(() => {
			var n = FC(), r = n.firstChild;
			return F(n, O(Mr, {
				get each() {
					return t().groups;
				},
				children: (n) => (() => {
					var r = RC(), i = r.firstChild, a = i.nextSibling;
					return F(r, O(k, {
						get when() {
							return n.site;
						},
						get fallback() {
							var e = zC();
							return A(() => P(cC), (t, n) => {
								N(e, t, n);
							}), e;
						},
						children: (n) => [O(k, {
							get when() {
								return !e.build;
							},
							get fallback() {
								var e = HC(), r = e.firstChild, i = r.nextSibling;
								return F(e, () => bS(t().root, n().file), r), F(e, () => n().line, i), A(() => ({
									e: P(sC),
									t: `${bS(t().root, n().file)}:${n().line}`
								}), ({ e: t, t: n }, r) => {
									N(e, t, r?.e), n !== r?.t && M(e, "data-site", n);
								}), e;
							},
							get children() {
								var e = BC(), r = e.firstChild, i = r.nextSibling;
								return i.nextSibling, e._$$click = () => pw(n().file, n().line, n().column), F(e, () => bS(t().root, n().file), r), F(e, () => n().line, i), A(() => ({
									e: P(aC),
									t: `${bS(t().root, n().file)}:${n().line}`
								}), ({ e: t, t: n }, r) => {
									N(e, t, r?.e), n !== r?.t && M(e, "data-site", n);
								}), e;
							}
						}), O(k, {
							get when() {
								return n().text;
							},
							get children() {
								var e = VC();
								return F(e, () => n().text), A(() => P(oC), (t, n) => {
									N(e, t, n);
								}), e;
							}
						})]
					}), i), F(r, O(Mr, {
						get each() {
							return n.classes;
						},
						children: (e) => (() => {
							var t = UC(), n = t.firstChild;
							n.firstChild;
							var r = n.nextSibling, i = r.firstChild, a = i.nextSibling, o = a.nextSibling, s = r.nextSibling;
							return F(n, () => e.cls, null), F(r, (() => {
								var t = Rr(() => e.kind === "marker");
								return () => t() ? `marker of kernel ${e.plugin}` : Rr(() => e.kind === "group")() ? "group marker" : Rr(() => e.kind === "other")() ? "not cssints" : e.decls.map((e) => `${e.prop}: ${e.value}`).join("; ");
							})(), i), F(r, (() => {
								var t = Rr(() => !!(e.kind === "class" && e.plugin));
								return () => t() ? `  (${e.plugin})` : "";
							})(), a), F(r, O(mw, { get of() {
								return e.conditions;
							} }), o), F(s, () => e.layer), A(() => ({
								e: P(Ci([], "_1s4813v _1cl1tpz _g2iyum _1kazkiv _16hpt8q _6to0fc", !e.active && "_1c7it6z")),
								t: e.cls,
								a: P(cC)
							}), ({ e, t: n, a: r }, i) => {
								N(t, e, i?.e), n !== i?.t && M(t, "data-class", n), N(s, r, i?.a);
							}), t;
						})()
					}), a), r;
				})()
			}), null), A(() => ({
				e: P(rC),
				t: P(iC)
			}), ({ e, t }, i) => {
				N(n, e, i?.e), N(r, t, i?.t);
			}), n;
		})(),
		(() => {
			var e = IC(), n = e.firstChild;
			return F(e, O(Mr, {
				get each() {
					return t().rows;
				},
				children: (e) => O(gw, { row: e })
			}), null), A(() => ({
				e: P(rC),
				t: P(iC)
			}), ({ e: t, t: r }, i) => {
				N(e, t, i?.e), N(n, r, i?.t);
			}), e;
		})(),
		O(k, {
			get when() {
				return t().tokens.length;
			},
			get children() {
				var e = LC(), n = e.firstChild;
				return F(e, O(Mr, {
					get each() {
						return t().tokens;
					},
					children: (e) => (() => {
						var t = WC(), n = t.firstChild, r = n.firstChild, i = r.nextSibling, a = i.nextSibling;
						return F(r, () => e.name), F(i, () => e.computed || "(not set)"), F(a, () => e.path), F(t, O(k, {
							get when() {
								return e.source;
							},
							get fallback() {
								var t = GC();
								return F(t, () => e.registered ? "the initial value of its @property" : "not set by cssints"), t;
							},
							children: (e) => (() => {
								var t = KC(), n = t.firstChild.nextSibling, r = n.nextSibling.nextSibling, i = r.nextSibling.nextSibling, a = i.nextSibling.nextSibling;
								return F(t, () => e().wrap.join(" "), n), F(t, () => e().selector, r), F(t, () => e().layer || "unlayered", i), F(t, () => e().on, a), t;
							})()
						}), null), A(() => ({
							e: P(lC),
							t: e.name,
							a: P(uC),
							o: P(dC),
							i: P(fC),
							n: P(cC)
						}), ({ e, t: o, a: s, o: c, i: l, n: u }, d) => {
							N(t, e, d?.e), o !== d?.t && M(t, "data-token", o), N(n, s, d?.a), N(r, c, d?.o), N(i, l, d?.i), N(a, u, d?.n);
						}), t;
					})()
				}), null), A(() => ({
					e: P(rC),
					t: P(iC)
				}), ({ e: t, t: r }, i) => {
					N(e, t, i?.e), N(n, r, i?.t);
				}), e;
			}
		})
	];
}
var yw = (e) => e.parentElement, bw = /* @__PURE__ */ new Map([
	["ArrowUp", yw],
	["ArrowDown", (e) => e.firstElementChild],
	["ArrowLeft", (e) => e.previousElementSibling],
	["ArrowRight", (e) => e.nextElementSibling]
]);
function xw(e) {
	let [t, n] = Dr(!1), [r, i] = Dr(!1), [a, o] = Dr(), [s, c] = Dr(), [l, u] = Dr(0), [d, f] = Dr(uw()), p = () => d().dock === "left" || d().dock === "right", m = () => {
		let e = h();
		return e ? (l(), e.innerWidth > e.innerHeight) : d().dock === "top" || d().dock === "bottom";
	}, [h, g] = Dr(), [_, ee] = Dr(!1), v = () => {
		h()?.close(), g(void 0);
	}, te = (e) => {
		let t = {
			...d(),
			...e
		};
		f(t), dw(t);
	}, ne = () => {
		let e = window.open("", "cssints-devtools", "popup,width=520,height=760");
		if (ee(!e), !e) return;
		let t = e.document.createElement("style");
		t.textContent = nw, e.document.title = "cssints devtools", e.document.head.replaceChildren(t), e.document.body.replaceChildren(), e.document.body.style.cssText = `margin: 0; background: ${zS}`, g(e), te({ detached: !0 });
	}, re = () => {
		v(), te({ detached: !1 });
	}, ie = (e) => {
		v(), te({
			dock: e,
			detached: !1
		});
	}, y = (e) => {
		if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
		let { dock: t } = d(), n = {
			left: e.clientX,
			top: e.clientY,
			right: innerWidth - e.clientX,
			bottom: innerHeight - e.clientY
		}, r = Math.round(Math.max(cw, Math.min(n[t], (p() ? innerWidth : innerHeight) - 80)));
		f((e) => p() ? {
			...e,
			w: r
		} : {
			...e,
			h: r
		});
	}, ae = () => {
		let { dock: e, w: t, h: n } = d(), r = p() ? `calc(min(${t}px, 100vw) - 3px)` : `calc(min(${n}px, 100vh) - 3px)`;
		return Object.fromEntries(iw.map((t) => [t, t === e ? r : ""]));
	}, oe = () => r() ? a() ?? s() : s(), [b, se] = Dr();
	Ar(() => e.asked()?.status, (e) => {
		let t = b();
		e === "running" && t && (t.value = "");
	}), Ar(() => e.asked()?.status, (t) => {
		t === "unavailable" && e.link?.();
	});
	let ce = () => {
		let t = e.model(), n = s(), r = b()?.value.trim();
		if (!r) return;
		let i = t && n?.isConnected ? fw(t, n) : void 0;
		e.ask?.(n && typeof i == "object" ? ES(i, n, r) : TS(r, location.href));
	}, le = () => e.linked(), x = () => le() ? le()?.connected ? "connected" : "disconnected" : "unknown", S = () => {
		let t = e.asked()?.id;
		return t ? `session · ${t.length > 14 ? `${t.slice(0, 14)}…` : t}` : "no session yet";
	}, C = (r = !t()) => {
		n(r), i(r && !s()), e.setActive(r), r && e.link?.(), r ? d().detached && !h() && ne() : v();
	}, ue = (t) => {
		let n = oe(), r = n && t(n);
		return !r || r === e.host ? !1 : (c(r), i(!1), !0);
	}, de = (e) => {
		if (e.altKey && e.shiftKey && e.code === "KeyC") {
			e.preventDefault(), C();
			return;
		}
		if (!t()) return;
		if (e.key === "Escape") {
			e.preventDefault(), r() && s() ? i(!1) : C(!1);
			return;
		}
		if (e.composedPath()[0]?.localName === "textarea" || r() && e.view === window) return;
		let n = bw.get(e.key);
		n && ue(n) && e.preventDefault();
	};
	Ar(h, (e) => (e?.addEventListener("keydown", de, !0), () => e?.removeEventListener("keydown", de, !0)));
	let fe = Er(() => {
		l();
		let n = e.model(), r = oe();
		return t() && n && r?.isConnected ? fw(n, r) : void 0;
	}, { equals: _w }), pe = Er(() => (l(), t() ? oe()?.getBoundingClientRect() : void 0));
	nr(() => {
		let n = (t) => t.composedPath().includes(e.host), s = (e) => {
			r() && !n(e) && e.target instanceof Element && e.target !== a() && o(e.target);
		}, l = (e) => {
			r() && !n(e) && e.target instanceof Element && (e.preventDefault(), e.stopPropagation(), c(e.target), i(!1));
		}, d = setInterval(() => {
			h()?.closed && re(), t() && u((e) => e + 1);
		}, 600);
		return document.addEventListener("pointermove", s, !0), document.addEventListener("click", l, !0), window.addEventListener("keydown", de, !0), window.addEventListener("pagehide", v), () => {
			clearInterval(d), document.removeEventListener("pointermove", s, !0), document.removeEventListener("click", l, !0), window.removeEventListener("keydown", de, !0), window.removeEventListener("pagehide", v);
		};
	}), Xn(() => {
		e.setActive(!1), v();
	}), nr(() => {
		e.build && C(!0);
	});
	let me = () => [(() => {
		var t = YC(), n = t.firstChild, a = n.firstChild, o = a.firstChild, c = o.nextSibling, l = c.nextSibling, u = l.nextSibling, f = u.nextSibling, g = a.nextSibling;
		return F(o, (() => {
			var e = Rr(() => typeof fe() == "object");
			return () => e() ? fe().element : "pick an element";
		})()), c._$$click = () => i(!r()), l._$$click = () => h() ? re() : ne(), F(a, O(Mr, {
			each: iw,
			children: (e) => (() => {
				var t = ZC();
				return t._$$click = () => ie(e), M(t, "data-dock", e), M(t, "title", `dock ${e}`), F(t, () => aw[e]), A(() => P(Ci([], "_i1h7gg _1kazld4 _14o2sa1 _k0i4ku _v4t4nx _fjx7jy _n5igo9 _1lwcmvy _1gmfivd", d().dock === e && "_1dh9zox _1h4s3ko")), (e, n) => {
					N(t, e, n);
				}), t;
			})()
		}), u), u._$$click = () => ue(yw), f._$$click = () => C(!1), F(n, O(k, {
			get when() {
				return Rr(() => !!_())() ? !h() : _();
			},
			get children() {
				var e = qC();
				return A(() => P(vC), (t, n) => {
					N(e, t, n);
				}), e;
			}
		}), g), F(g, O(k, {
			get when() {
				return e.model();
			},
			get fallback() {
				var t = PC();
				return F(t, () => e.build ? "loading the table…" : "waiting for the dev server…"), A(() => P(yC), (e, n) => {
					N(t, e, n);
				}), t;
			},
			get children() {
				return O(k, {
					get when() {
						return Rr(() => typeof fe() == "object")() ? fe() : void 0;
					},
					get fallback() {
						var e = PC();
						return F(e, (() => {
							var e = Rr(() => typeof fe() == "string");
							return () => e() ? fe() : "hover an element and click to pick it";
						})()), A(() => P(yC), (t, n) => {
							N(e, t, n);
						}), e;
					},
					children: (t) => O(vw, {
						get inspection() {
							return t();
						},
						get build() {
							return e.build;
						}
					})
				});
			}
		})), F(t, O(k, {
			get when() {
				return e.ask;
			},
			get children() {
				var t = JC(), n = t.firstChild, r = n.firstChild, i = r.nextSibling, a = i.firstChild;
				a.nextSibling;
				var o = n.nextSibling, c = o.nextSibling;
				return F(i, (() => {
					var e = Rr(() => x() === "connected");
					return () => e() ? "connected" : x() === "unknown" ? "checking" : "not connected";
				})(), null), o._$$keydown = (e) => {
					e.key === "Enter" && !e.shiftKey && !e.isComposing && (e.preventDefault(), ce());
				}, o.addEventListener("focus", () => e.link?.()), si(() => se, o), F(c, O(k, {
					get when() {
						return le();
					},
					fallback: "Looking for an OpenCode service…",
					children: (t) => O(k, {
						get when() {
							return t().connected;
						},
						get fallback() {
							return `Not connected. Start OpenCode (or run \`opencode serve --service\`); this server finds it by itself. Sessions open in ${t().directory}. @opencode/client must be in the devDependencies of the app.${t().message ? ` ${t().message}` : ""}`;
						},
						get children() {
							return [
								Rr(() => `connected to ${t().url} · `),
								(() => {
									var t = QC();
									return F(t, S), A(() => e.asked()?.id, (e) => {
										M(t, "title", e);
									}), t;
								})(),
								O(k, {
									get when() {
										return e.asked();
									},
									children: (e) => (() => {
										var t = $C();
										return F(t, () => ` · ${e().message ?? e().status}`), A(() => P(e().status === "completed" ? hC : e().status === "running" || e().status === "sending" ? cC : gC), (e, n) => {
											N(t, e, n);
										}), t;
									})()
								})
							];
						}
					})
				})), A(() => ({
					e: P(Ci([], "_1s47490 _1njigwa _x06mdc _baxxsq _1t8gqy5 _1a8gflu _r0xwy4", m() ? xC : bC)),
					t: m() ? "side" : "bottom",
					a: P(SC),
					o: P(CC),
					i: x(),
					n: P(Ci([], "_n7bsss _arb2v3 _1b2tse0 _1nu71z9", x() === "connected" ? wC : TC)),
					s: P(Ci([], "_1jvfuo0 _1ywigwl _lqk467 _14o2sa1 _k0i4ku _1ajqzk5 _fjx7jy _n5igo9", m() && "_1wme27f _5x4zpc _1hjgerl")),
					h: s() ? "Ask OpenCode to change this element (Enter sends)" : "Ask OpenCode to change the page, or pick an element first (Enter sends)",
					r: x(),
					d: e.asked()?.status ?? "idle"
				}), ({ e, t: s, a: l, o: u, i: d, n: f, s: p, h: m, r: h, d: g }, _) => {
					N(t, e, _?.e), s !== _?.t && M(t, "data-layout", s), N(n, l, _?.a), N(r, u, _?.o), d !== _?.i && M(i, "data-link", d), N(a, f, _?.n), N(o, p, _?.s), m !== _?.h && M(o, "placeholder", m), h !== _?.r && M(c, "data-link", h), g !== _?.d && M(c, "data-status", g);
				}), t;
			}
		}), null), A(() => ({
			e: P(Ci([], "_1hqog5g _120vnyk _1s47490 _szl2in _1a8gflu _fjx7jy _omr8bg _6to19l _dnf785", m() ? WS : US, h() ? JS : ow[d().dock])),
			t: d().dock,
			a: h() ? "yes" : "no",
			o: P(h() ? {
				width: "",
				height: ""
			} : p() ? {
				width: `min(${d().w}px, 100vw)`,
				height: ""
			} : {
				height: `min(${d().h}px, 100vh)`,
				width: ""
			}),
			i: P(QS),
			n: P(eC),
			s: P(tC),
			h: P(Ci([], "_i1h7gg _1kazld4 _14o2sa1 _k0i4ku _v4t4nx _fjx7jy _n5igo9 _1lwcmvy _1gmfivd", r() && "_1dh9zox _1h4s3ko")),
			r: r() ? "yes" : "no",
			d: P(Ci([], "_i1h7gg _1kazld4 _14o2sa1 _k0i4ku _v4t4nx _fjx7jy _n5igo9 _1lwcmvy _1gmfivd", h() && "_1dh9zox _1h4s3ko")),
			l: h() ? "yes" : "no",
			u: h() ? "dock back" : "detach into a window",
			c: P(nC),
			w: P(nC),
			m: P($S)
		}), ({ e, t: r, a: i, o: s, i: d, n: p, s: m, h, r: _, d: ee, l: v, u: te, c: ne, w: re, m: ie }, y) => {
			N(t, e, y?.e), r !== y?.t && M(t, "data-dock", r), i !== y?.a && M(t, "data-detached", i), ii(t, s, y?.o), N(n, d, y?.i), N(a, p, y?.n), N(o, m, y?.s), N(c, h, y?.h), _ !== y?.r && M(c, "data-on", _), N(l, ee, y?.d), v !== y?.l && M(l, "data-on", v), te !== y?.u && M(l, "title", te), N(u, ne, y?.c), N(f, re, y?.w), N(g, ie, y?.m);
		}), t;
	})(), O(k, {
		get when() {
			return !h();
		},
		get children() {
			var e = XC();
			return e._$$pointerup = () => dw(d()), e._$$pointermove = y, e._$$pointerdown = (e) => {
				e.currentTarget.setPointerCapture(e.pointerId), e.preventDefault();
			}, A(() => ({
				e: P(p() ? XS : ZS),
				t: P(ae())
			}), ({ e: t, t: n }, r) => {
				N(e, t, r?.e), ii(e, n, r?.t);
			}), e;
		}
	})];
	return [
		(() => {
			var e = ew();
			return e._$$click = () => C(), A(() => P(BS), (t, n) => {
				N(e, t, n);
			}), e;
		})(),
		O(k, {
			get when() {
				return pe();
			},
			children: (e) => (() => {
				var t = tw(), n = t.firstChild;
				return F(n, (() => {
					var e = Rr(() => typeof fe() == "object");
					return () => e() ? fe().element : "";
				})()), A(() => ({
					e: P(VS),
					t: `${e().top}px`,
					a: `${e().left}px`,
					o: `${e().width}px`,
					i: `${e().height}px`,
					n: P(HS)
				}), ({ e, t: r, a: i, o: a, i: o, n: s }, c) => {
					N(t, e, c?.e), r !== c?.t && ai(t, "top", r), i !== c?.a && ai(t, "left", i), a !== c?.o && ai(t, "width", a), o !== c?.i && ai(t, "height", o), N(n, s, c?.n);
				}), t;
			})()
		}),
		O(k, {
			get when() {
				return t();
			},
			get children() {
				return O(k, {
					get when() {
						return h();
					},
					get fallback() {
						return O(me, {});
					},
					children: (e) => O(xi, {
						get mount() {
							return e().document.body;
						},
						get children() {
							return O(me, {});
						}
					})
				});
			}
		})
	];
}
function Sw(e) {
	if (document.querySelector(rw)) return;
	let t = document.createElement(rw);
	t.setAttribute("style", "all: initial");
	let n = t.attachShadow({ mode: "open" }), r = document.createElement("style");
	r.textContent = nw;
	let i = document.createElement("div");
	n.append(r, i), document.documentElement.append(t);
	let a = Lm(RS().pipe(Em(IS, e))), [o, s] = Dr();
	Fm(fx(wx(a.model), (e) => em(() => s(() => e))));
	let [c, l] = Dr(), u = { ref: 0 }, d = e.ask && ((t) => {
		l((e) => ({
			status: "sending",
			id: e?.id
		})), u.ref += 1, e.ask?.(u.ref, t);
	});
	d && e.on(PS, (e) => {
		let t = e;
		t.ref === u.ref && l((e) => ({
			...e,
			...t
		}));
	});
	let [f, p] = Dr();
	e.link && e.on(FS, (e) => p(e)), Kr(() => O(xw, {
		model: o,
		setActive: (e) => Lm(a.setActive(e)),
		host: t,
		get build() {
			return e.build;
		},
		ask: d,
		asked: c,
		get link() {
			return e.link;
		},
		linked: f
	}), i);
}
Jr([
	"click",
	"keydown",
	"pointerdown",
	"pointermove",
	"pointerup"
]);
//#endregion
export { Sw as mount };
