const VALID = ['elena', 'alexey', 'archive'];

function getArtist(req) {
  const a = req.query.artist;
  if (VALID.includes(a)) return a;
  return null;
}

// Combined/apex view: elena + alexey only, archive always excluded
function combinedFilter() {
  return { artist: { $in: ['elena', 'alexey'] } };
}

// Build the base query filter from a request
function artistFilter(req) {
  const artist = getArtist(req);
  return artist ? { artist } : combinedFilter();
}

module.exports = { getArtist, combinedFilter, artistFilter };
