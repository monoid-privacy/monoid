import React, { DetailedHTMLProps, useMemo } from 'react';
import { Buffer } from 'buffer';
import { classNames } from '../utils/utils';

type ImgProps = DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>;
interface SVGTextProps extends ImgProps {
  imageText: string
}

export default function SVGText(props: SVGTextProps) {
  const {
    imageText, className, alt, ...rest
  } = props;
  const imageData = useMemo(() => {
    const buff = Buffer.from(imageText);
    return buff.toString('base64');
  }, [imageText]);

  return (
    <img
      className={classNames('w-5 h-5', className)}
      src={`data:image/svg+xml;base64,${imageData}`}
      alt={alt}
      {...rest}
    />
  );
}
