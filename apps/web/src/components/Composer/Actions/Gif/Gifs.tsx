import type { IGif } from '@hey/types/giphy';
import type { FC } from 'react';

import { GIPHY_KEY } from '@hey/data/constants';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface CategoriesProps {
  debouncedGifInput: string;
  setGifAttachment: (gif: IGif) => void;
  setSearchText: (searchText: string) => void;
  setShowModal: (showModal: boolean) => void;
}

const Gifs: FC<CategoriesProps> = ({
  debouncedGifInput,
  setGifAttachment,
  setSearchText,
  setShowModal
}) => {
  const onSelectGif = (item: IGif) => {
    setGifAttachment(item);
    setSearchText('');
    setShowModal(false);
  };

  const fetchGifs = async (input: string) => {
    try {
      const response = await axios.get('https://api.giphy.com/v1/gifs/search', {
        params: { api_key: GIPHY_KEY, limit: 48, q: input }
      });

      return response.data;
    } catch {
      return [];
    }
  };

  const { data: gifs, isFetching } = useQuery({
    enabled: Boolean(debouncedGifInput),
    queryFn: () => fetchGifs(debouncedGifInput),
    queryKey: ['gifs', debouncedGifInput]
  });

  if (isFetching) {
    return (
      <div className="grid w-full grid-cols-3 gap-1 overflow-y-auto">
        {Array.from(Array(12).keys()).map((key) => (
          <div
            className="shimmer h-32 w-full cursor-pointer object-cover"
            key={key}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid w-full grid-cols-3 gap-1 overflow-y-auto">
      {gifs?.pages.map((page: any) =>
        page.data.map((gif: IGif) => (
          <button
            className="relative flex outline-none"
            key={gif.id}
            onClick={() => onSelectGif(gif)}
            type="button"
          >
            <img
              alt={gif.slug}
              className="h-32 w-full cursor-pointer object-cover"
              draggable={false}
              height={128}
              src={gif?.images?.original?.url}
            />
          </button>
        ))
      )}
    </div>
  );
};

export default Gifs;
