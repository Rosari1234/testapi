import { Console } from "console";

export class PmtCalculator {
  price = 0;
  rate = 0;
  term = 0;
  downPayment = 0;
  paymentFrequency = 0;
  day1FirstPay = 0;

  constructor(
    price: number,
    rate: number,
    term: number,
    downPayment: number,
    paymentFrequency: number,
    day1FirstPay: number
  ) {
    this.price = Number(price);
    this.rate = Number(rate);
    this.term = Number(term);
    this.downPayment = Number(downPayment);
    this.paymentFrequency = Number(paymentFrequency);
    this.day1FirstPay = day1FirstPay - 30;
  }
  getPriceList() {
    const dwn1 = this.downPayment;
    const dwn2 = dwn1 > 0 ? dwn1 * 1.75 : 1000;
    const dwn3 = dwn2 == 1000 ? 2500 : dwn2 * 2;

    const t1 = this.term;
    const t2 = this.term + 12;
    const t3 = this.term + 24;

    console.log("t1", t1)
    console.log("t2", t2)
    console.log("t3", t3)
    const price1 = this.calculateRates(dwn1);
    const price2 = this.calculateRates(dwn2);
    const price3 = this.calculateRates(dwn3);

    return {
      dwn1,
      dwn2,
      dwn3,
      price1,
      price2,
      price3,
      t1,
      t2,
      t3,
    };
  }

  calculateRates(downPayment: number) {
    const rt1 = this.rate / 100;
    const rt2 = (this.rate + 0.25) / 100;
    const rt3 = (this.rate + 0.5) / 100;

    const ir1 = rt1 / this.paymentFrequency;
    const ir2 = rt2 / this.paymentFrequency;
    const ir3 = rt3 / this.paymentFrequency;

    console.log("ir1",ir1)
    const t1 = this.term;
    const t2 = this.term + 12;
    const t3 = this.term + 24;

    const np1 = (t1 / 12) * this.paymentFrequency;
    const np2 = (t2 / 12) * this.paymentFrequency;
    const np3 = (t3 / 12) * this.paymentFrequency;
    console.log("np1",np1)
    // -((TtlPrice1)+((Days1stPay-30)*Price1DayRate2))
    const totalPrice = this.price - downPayment;
    const pv1 =
      (totalPrice + this.day1FirstPay * ((rt1 / 360) * totalPrice)) * -1;
    const pv2 =
      (totalPrice + this.day1FirstPay * ((rt2 / 360) * totalPrice)) * -1;
    const pv3 =
      (totalPrice + this.day1FirstPay * ((rt3 / 360) * totalPrice)) * -1;
      console.log("pv1",pv1)
    const rate1 = this.calculatePMT(ir1, np1, pv1);
    const rate2 = this.calculatePMT(ir2, np2, pv2);
    const rate3 = this.calculatePMT(ir3, np3, pv3);
    console.log("rate1",rate1)
    return { rate1, rate2, rate3, rt1, rt2, rt3 };
  }

  calculatePMT(ir: any, np: any, pv: any) {
    let pmt, pvif, fv, type;
    fv || (fv = 0);
    type || (type = 0);

    if (ir == 0) return -(pv + fv) / np;

    pvif = Math.pow(1 + ir, np);
    pmt = (-ir * (pv * pvif + fv)) / (pvif - 1);
    if (type == 1) pmt /= 1 + ir;
    return Math.round(pmt * 100) / 100;
  }
}
