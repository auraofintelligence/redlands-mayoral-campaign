export function campaignPresentation(c) {
  const isLive = c.publicationMode === 'live';
  const authoriser = String(c.authorisation?.name || '').trim();
  const address = String(c.authorisation?.address || '').trim();
  const authorisationComplete = Boolean(authoriser && address && c.authorisation?.status === 'complete');
  const nominationCertified = c.nominationCertified === true;
  const nominationStatus = nominationCertified ? 'Nomination certified' : String(c.status || 'Exploring a possible mayoral campaign');
  const nominationDetail = nominationCertified ? 'The campaign record marks the nomination as certified.' : 'Nomination certification is not confirmed.';
  const authorisationText = authorisationComplete
    ? `Authorised by ${authoriser}, ${address}.`
    : `Publication authorisation is incomplete. Authoriser: ${authoriser || 'not supplied'}. ${address ? 'An address is recorded, but the authorisation review is incomplete.' : 'No address is published.'}`;
  return {
    isLive, authorisationComplete, nominationCertified, nominationStatus, nominationDetail, authorisationText,
    publicationLabel: isLive ? 'Campaign record' : 'Campaign preparation preview',
    publicationSummary: isLive ? 'This edition is the public campaign record.' : 'This edition is a campaign preparation preview.',
    campaignActivity: nominationCertified ? 'is pursuing' : 'is exploring',
    nominationSummary: `${nominationStatus}. ${nominationDetail}`,
    officeStatus: nominationCertified ? `Nomination certified for ${c.office}.` : `${nominationStatus}. Office under consideration: ${c.office}.`,
    authorisationLabel: authorisationComplete ? 'Authorisation recorded.' : 'Authorisation incomplete.',
    distributionNote: isLive && authorisationComplete
      ? 'This brief reflects the current campaign record. Check its source date before reuse.'
      : 'This is a preparation brief. It is not ready for external electoral distribution.'
  };
}
