const FALLBACK_IMAGE_URL = '/images/property-fallback.svg';

const LEGACY_LOCAL_IMAGE_PATTERNS = [
  /^\/?uploads\//i,
  /^[^/]+\.(png|jpe?g|gif|webp|svg)$/i,
];

const isAbsoluteUrl = (value) => /^https?:\/\//i.test(value || '');

const isLegacyLocalPath = (value) => LEGACY_LOCAL_IMAGE_PATTERNS.some((pattern) => pattern.test(value || ''));

const applyCloudinaryTransformations = (url, { width, height } = {}) => {
  if (!url.includes('/upload/')) {
    return url;
  }

  const transformations = ['f_auto', 'q_auto', 'dpr_auto'];

  if (width) {
    transformations.push(`w_${width}`);
  }

  if (height) {
    transformations.push(`h_${height}`, 'c_fill', 'g_auto');
  }

  return url.replace('/upload/', `/upload/${transformations.join(',')}/`);
};

const getHomeImageUrl = (value, options = {}) => {
  if (!value || !isAbsoluteUrl(value) || isLegacyLocalPath(value)) {
    return FALLBACK_IMAGE_URL;
  }

  if (value.includes('res.cloudinary.com')) {
    return applyCloudinaryTransformations(value, options);
  }

  return value;
};

const getHomeImageSrcSet = (value, widths = [320, 480, 720], options = {}) => {
  const baseUrl = getHomeImageUrl(value, options);

  if (baseUrl === FALLBACK_IMAGE_URL || !baseUrl.includes('res.cloudinary.com')) {
    return '';
  }

  return widths
    .map((width) => `${getHomeImageUrl(value, { ...options, width })} ${width}w`)
    .join(', ');
};

module.exports = {
  FALLBACK_IMAGE_URL,
  getHomeImageUrl,
  getHomeImageSrcSet,
};
