export function campaignPresentation(c) {
  if(c.publicationMode === 'civic-simulation') return {
    isLive:false, isCivic:true, authorisationComplete:false, nominationCertified:false,
    publicationLabel:'Redlands civic simulation', publicationSummary:'A public invitation to explore connected projects and civic possibilities.',
    officeStatus:'Luke Nathan Hayes is not contesting the 2026 Redland City mayoral by-election.',
    authorisationText:'', nominationStatus:c.status, nominationDetail:'Decision recorded 10 November 2026.',
    nominationSummary:c.status, authorisationLabel:'Civic project collection',
    distributionNote:'This edition presents independent civic research and licensing enquiries. Luke is not contesting the by-election.'
  };
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
