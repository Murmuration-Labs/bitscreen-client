import { NetworkType } from 'pages/Filters/Interfaces';

export const NetworkChips = (props: {
  networks: NetworkType[];
}): JSX.Element => {
  const { networks } = props;
  let backgroundColor: string;
  let borderColor: string;
  let text: string;

  return (
    <div className="d-flex" style={{ gap: '6px' }}>
      {networks
        .sort(
          (a, b) =>
            Object.values(NetworkType).indexOf(b) -
            Object.values(NetworkType).indexOf(a)
        )
        .map((network) => {
          switch (network) {
            case NetworkType.IPFS:
              backgroundColor = '#D63384';
              borderColor = '#AB296A';
              text = 'IPFS';
              break;

            case NetworkType.Filecoin:
              backgroundColor = '#6F42C1';
              borderColor = '#59359A';
              text = 'FIL';
              break;
          }
          return (
            <div
              style={{
                backgroundColor,
                border: `1px solid ${borderColor}`,
                padding: '4px 8px',
                borderRadius: '50px',
                fontWeight: 400,
                fontSize: '12px',
                color: 'white',
                lineHeight: '16px',
              }}
            >
              {text}
            </div>
          );
        })}
    </div>
  );
};
