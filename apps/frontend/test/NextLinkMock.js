const React = require('react');
module.exports = React.forwardRef(function NextLinkMock(props, ref) {
  const { href, children, ...rest } = props;
  return React.createElement('a', { href, ref, ...rest }, children);
});