/**
 * 图片处理工具
 */
import React, { useState } from "react";
import { Button, message } from "antd";
import { FolderAddOutlined } from "@ant-design/icons";
import { useIntl } from "react-intl";
import Tabs from "./components/Tabs";
import {
  fileOrBlobToDataURL,
  getImageType,
  getCanvasImgData,
  imageDataToBlob,
  exportToImage,
} from "utils/fileUtil";
import BasicOperation from "./components/BasicOperation";
import RectClip from "./components/RectClip";
import RadiusClip from "./components/RadiusClip";
import ChangeSize from "./components/ChangeSize";
import ChangeBrightness from "./components/ChangeBrightness";
import ChangeDiaphaneity from "./components/ChangeDiaphaneity";
import AddWatermark from "./components/AddWatermark";
import CoverWithMosaic from "./components/CoverWithMosaic";
import Compression from "./components/Compression";
import styles from "./index.module.scss";
import { div } from "@tensorflow/tfjs-core";

export interface ImgInfo {
  name: string;
  fileType: string;
  size: number;
  imgUrl: string;
  width: number;
  height: number;
  imageData: ImageData;
}

enum TabId {
  "basicOperation",
  "rectClip",
  "radiusClip",
  "changeSize",
  "changeBrightness",
  "changeDiaphaneity",
  "addWatermark",
  "coverWithMosaic",
  "photoCompression",
}

const primaryColor = "#0E5E6F";
const primaryShallowColor = "#3A8891";

const GameImage = () => {
  const intl = useIntl();
  const [imgDragOver, setImgDragOver] = useState<boolean>(false);
  const [imgInfo, setImgInfo] = useState<ImgInfo | null>(null);

  // 导出图片
  const exportImage = (imageData: ImageData, exportImageType?: string) => {
    if (!imageData || !imgInfo) return;
    imageDataToBlob(
      imageData,
      exportImageType || imgInfo.fileType,
      (blob: Blob | null) => {
        if (blob) {
          let imgName = "image";
          if (imgInfo && imgInfo.name) {
            const arr = imgInfo.name.split(".");
            if (arr.length > 1) {
              arr.splice(
                arr.length - 1,
                1,
                exportImageType
                  ? exportImageType.toLowerCase()
                  : imgInfo.fileType.toLowerCase()
              );
              imgName = arr.join(".");
            } else {
              arr.push(
                exportImageType
                  ? exportImageType.toLowerCase()
                  : imgInfo.fileType.toLowerCase()
              );
              imgName = arr.join(".");
            }
          }
          exportToImage(blob, imgName);
        }
      }
    );
  };

  const onTabsChange = (tabId: TabId) => {
    setSelectedTabId(tabId);
  };

  const getImgInfo = (files: FileList) => {
    if (!files) return;
    for (let i = 0, l = files.length; i < l; i++) {
      const file = files[i];
      const { type } = file;
      const typeArr = type.split("/");
      if (typeArr[0] !== "image") return;
      let fileType = typeArr[1].toUpperCase();
      var reader = new FileReader();
      reader.onload = function (e: any) {
        const buffer = e.target.result;
        const imageType = getImageType(buffer);
        if (imageType) {
          fileType = imageType;
        }
        const blob = new Blob([buffer]);
        fileOrBlobToDataURL(blob, function (dataUrl: string | null) {
          if (dataUrl) {
            const image = new Image();
            image.onload = function () {
              const width = image.width;
              const height = image.height;
              const imageData = getCanvasImgData(dataUrl, width, height);
              if (imageData) {
                const imgInfo: ImgInfo = {
                  name: file.name,
                  fileType,
                  size: file.size,
                  width,
                  height,
                  imgUrl: dataUrl,
                  imageData,
                };
                setImgInfo(imgInfo);
              } else {
                setImgInfo(null);
                message.error(
                  intl.formatMessage({
                    id: "page.imageProcessingTool.parsingDataFailure",
                  })
                );
              }
            };
            image.onerror = function () {
              setImgInfo(null);
              message.error(
                intl.formatMessage({
                  id: "page.imageProcessingTool.parsingDataFailure",
                })
              );
            };
            image.src = dataUrl;
          } else {
            setImgInfo(null);
            message.error(
              intl.formatMessage({
                id: "page.imageProcessingTool.parsingDataFailure",
              })
            );
          }
        });
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const onUploadChange = (e: any) => {
    const { files } = e.target;
    getImgInfo(files);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!imgDragOver) {
      setImgDragOver(true);
    }
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    e.preventDefault();
    imgDragOver && setImgDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.stopPropagation();
    e.preventDefault();
    imgDragOver && setImgDragOver(false);
    const { files } = e.dataTransfer;
    getImgInfo(files);
  };

  const onClear = () => {
    setImgInfo(null);
  };

  const tabsList = [
    {
      id: TabId.basicOperation,
      label: intl.formatMessage({
        id: "menu.imageProcessingTool.basicOperation",
      }),
      element: (
        <BasicOperation
          imgInfo={imgInfo as ImgInfo}
          exportImage={exportImage}
          imgDragOver={imgDragOver}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClear={onClear}
        />
      ),
    },
    {
      id: TabId.rectClip,
      label: intl.formatMessage({
        id: "menu.imageProcessingTool.rectangularClipping",
      }),
      element: (
        <RectClip
          imgInfo={imgInfo as ImgInfo}
          exportImage={exportImage}
          imgDragOver={imgDragOver}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClear={onClear}
        />
      ),
    },
    {
      id: TabId.radiusClip,
      label: intl.formatMessage({
        id: "menu.imageProcessingTool.roundedCornerClipping",
      }),
      element: (
        <RadiusClip
          imgInfo={imgInfo as ImgInfo}
          exportImage={exportImage}
          imgDragOver={imgDragOver}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClear={onClear}
        />
      ),
    },
    {
      id: TabId.changeSize,
      label: intl.formatMessage({
        id: "menu.imageProcessingTool.modifyTheSize",
      }),
      element: (
        <ChangeSize
          imgInfo={imgInfo as ImgInfo}
          exportImage={exportImage}
          imgDragOver={imgDragOver}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClear={onClear}
        />
      ),
    },
    {
      id: TabId.changeBrightness,
      label: intl.formatMessage({
        id: "menu.imageProcessingTool.modifyBrightness",
      }),
      element: (
        <ChangeBrightness
          imgInfo={imgInfo as ImgInfo}
          exportImage={exportImage}
          imgDragOver={imgDragOver}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClear={onClear}
        />
      ),
    },
    {
      id: TabId.changeDiaphaneity,
      label: intl.formatMessage({
        id: "menu.imageProcessingTool.modifyTransparency",
      }),
      element: (
        <ChangeDiaphaneity
          imgInfo={imgInfo as ImgInfo}
          exportImage={exportImage}
          imgDragOver={imgDragOver}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClear={onClear}
        />
      ),
    },
    {
      id: TabId.addWatermark,
      label: intl.formatMessage({
        id: "menu.imageProcessingTool.addWatermark",
      }),
      element: (
        <AddWatermark
          imgInfo={imgInfo as ImgInfo}
          exportImage={exportImage}
          imgDragOver={imgDragOver}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClear={onClear}
        />
      ),
    },
    {
      id: TabId.coverWithMosaic,
      label: intl.formatMessage({
        id: "menu.imageProcessingTool.coverWithMosaics",
      }),
      element: (
        <CoverWithMosaic
          imgInfo={imgInfo as ImgInfo}
          exportImage={exportImage}
          imgDragOver={imgDragOver}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClear={onClear}
        />
      ),
    },
    {
      id: TabId.photoCompression,
      label: intl.formatMessage({
        id: "menu.imageProcessingTool.imageCompression",
      }),
      element: (
        <Compression
          imgInfo={imgInfo as ImgInfo}
          imgDragOver={imgDragOver}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClear={onClear}
        />
      ),
    },
  ];
  const [selectedTabId, setSelectedTabId] = useState<TabId>(tabsList[0].id);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Tabs
          className={styles.tabs}
          data={tabsList}
          selectedTabId={selectedTabId}
          onChange={onTabsChange}
        />
        {!imgInfo && (
          <div
            className={styles.imgBox}
            style={{
              borderColor: imgDragOver ? primaryColor : primaryShallowColor,
            }}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <div className={styles.emptyBox}>
              <Button type="primary" className={styles.uploadBtn}>
                <FolderAddOutlined />
                {intl.formatMessage({
                  id: "common.uploadFile",
                })}
                <input
                  type="file"
                  accept="image/jpg, image/jpeg, image/png"
                  onChange={onUploadChange}
                />
              </Button>
              <p className={styles.text}>
                {intl.formatMessage({
                  id: "common.dragTheFileHere",
                })}
              </p>
              <p className={styles.tips}>
                {intl.formatMessage({
                  id: "common.supportedImageType",
                })}
              </p>
            </div>
          </div>
        )}
        {!imgInfo && (
          <div className={styles.extensionTip}>
            {intl.formatMessage({
              id: "page.imageProcessingTool.extensionTipFront",
            })}
            <span
              onClick={() => {
                window.open(
                  "https://github.com/hepengwei/processing-image-tool"
                );
              }}
            >
              &nbsp;processing-image-tool&nbsp;
            </span>
            {intl.formatMessage({
              id: "page.imageProcessingTool.extensionTipBehind",
            })}
          </div>
        )}
        {imgInfo &&
          tabsList.filter((item) => item.id === selectedTabId)[0].element}
      </div>
    </div>
  );
};

export default GameImage;
