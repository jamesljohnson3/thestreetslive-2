// Import necessary modules...
import { GetStaticProps, GetStaticPaths, NextPage } from 'next';
import Head from 'next/head';
import Carousel from '../../../../components/Carousel';
import getResults from '../../../../utils/cachedImages';
import cloudinary from '../../../../utils/cloudinary';
import getBase64ImageUrl from '../../../../utils/generateBlurPlaceholder';
import type { ImageProps } from '../../../../utils/types';
import { getSiteWorkspace } from '../../../../../prisma/services/workspace';
import { useRouter } from 'next/router';

const PhotoPage: NextPage<{ currentPhoto: ImageProps }> = ({ currentPhoto }) => {
  const router = useRouter();
  const { photoId } = router.query;
  let index = Number(photoId)

  const currentPhotoUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_scale,w_2560/${currentPhoto.public_id}.${currentPhoto.format}`;

  return (
    <>
      <Head>
        <title>Next.js Conf 2022 Photos</title>
        <meta property="og:image" content={currentPhotoUrl} />
        <meta name="twitter:image" content={currentPhotoUrl} />
      </Head>
      <main className="mx-auto max-w-[1960px] p-4">
        <Carousel currentPhoto={currentPhoto} index={index} />
      </main>
    </>
  );
};

export default PhotoPage;

export const getStaticProps: GetStaticProps = async (context) => {
  const results = await getResults();
  let reducedResults: ImageProps[] = []
  let i = 0
  for (let result of results.resources) {
    reducedResults.push({
      id: i,
      height: result.height,
      width: result.width,
      public_id: result.public_id,
      format: result.format,
    })
    i++
  }
  const { site, photoId } = context.params;



  // Ensure siteWorkspace is defined and has a slug property
  const siteWorkspace = await getSiteWorkspace(site, site?.includes('.'));
  if (!siteWorkspace || !siteWorkspace.slug) {
    return {
      notFound: true,
    };
  }


  const currentPhoto = reducedResults.find(
    (img) => img.id === Number(context.params.photoId)
  )


  // Ensure currentPhoto is found
  if (!currentPhoto) {
    return {
      notFound: true,
    };
  }

  currentPhoto.blurDataUrl = await getBase64ImageUrl(currentPhoto);

  return {
    props: {
      currentPhoto,
    },
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const results = await cloudinary.v2.search
    .expression(`folder:${process.env.CLOUDINARY_FOLDER}/*`)
    .sort_by('public_id', 'desc')
    .max_results(400)
    .execute()

  let fullPaths = []
  for (let i = 0; i < results.resources.length; i++) {
    fullPaths.push({ params: { photoId: i.toString() } })
  }

  return {
    paths: fullPaths,
    fallback: false,

  };
};
