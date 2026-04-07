const { haversine } = require('./utils');

function fastDetourEstimate (a,b){
    const ap = [a.pickupLat, a.pickupLng];
    const ad = [a.dropLat, a.dropLng];
    const bp = [b.pickupLat, b.pickupLng];
    const bd = [b.dropLat, b.dropLng];


    const d = (p1, p2) => haversine(p1[0], p1[1], p2[0], p2[1]);

    const order1 =
    d(ap, bp) +
    d(bp, ad) +
    d(ad, bd);


  const order2 =
    d(ap, bp) +
    d(bp, bd) +
    d(bd, ad);


  const order3 =
    d(bp, ap) +
    d(ap, ad) +
    d(ad, bd);


  const order4 =
    d(bp, ap) +
    d(ap, bd) +
    d(bd, ad);

    const combined = Math.min(order1, order2, order3, order4);

    const individual =
    d(ap, ad) +
    d(bp, bd);

  if (individual === 0) return 0;

  const ratio = (combined - individual) / individual;

  return Math.max(0, ratio);
}

module.exports = {
  fastDetourEstimate,
};
