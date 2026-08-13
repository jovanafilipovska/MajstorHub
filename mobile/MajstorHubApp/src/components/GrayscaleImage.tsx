import Svg, { Defs, FeColorMatrix, Filter, Image as SvgImage } from 'react-native-svg';

interface GrayscaleImageProps {
  uri: string;
  size: number;
  filterId: string;
}

export function GrayscaleImage({ uri, size, filterId }: GrayscaleImageProps) {
  return (
    <Svg width={size} height={size}>
      <Defs>
        <Filter id={filterId}>
          <FeColorMatrix type="saturate" values="0" />
        </Filter>
      </Defs>
      <SvgImage
        href={{ uri }}
        x={0}
        y={0}
        width={size}
        height={size}
        preserveAspectRatio="xMidYMid slice"
        filter={`url(#${filterId})`}
      />
    </Svg>
  );
}