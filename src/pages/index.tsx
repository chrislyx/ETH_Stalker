import { getTransfersWithList } from "@/utils/transferslist";
import { getTransfers } from "@/utils/transfers";

import type { NextPage } from "next";
import styles from "./index.module.css";
import { WalletConnectButton } from "@/components";
import { useEffect, useState } from "react";

import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import LoadingButton from "@mui/lab/LoadingButton";
import TextField from "@mui/material/TextField";

import { followListInfoQuery, searchUserInfoQuery } from "@/utils/query";
import { FollowListInfoResp, SearchUserInfoResp, Network } from "@/utils/types";
import { formatAddress, removeDuplicate, isValidAddr } from "@/utils/helper";
import { useWeb3 } from "@/context/web3Context";
import { StaticDatePicker } from "@mui/lab";
import { userInfo } from "os";

const NAME_SPACE = "CyberConnect";
const NETWORK = Network.ETH;
const FIRST = 10; // The number of users in followings/followers list for each fetch

const Home: NextPage = () => {
  const { address, cyberConnect } = useWeb3();
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarText, setSnackbarText] = useState<string>("");

  const [searchInput, setSearchInput] = useState<string>("");
  const [searchAddrInfo, setSearchAddrInfo] =
    useState<SearchUserInfoResp | null>(null);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);

  const [followListInfo, setFollowListInfo] =
    useState<FollowListInfoResp | null>(null);
  const [followLoading, setFollowLoading] = useState<boolean>(false);

  const fetchSearchAddrInfo = async (toAddr: string) => {
    const resp = await searchUserInfoQuery({
      fromAddr: address,
      toAddr,
      network: NETWORK,
    });
    if (resp) {
      setSearchAddrInfo(resp);
    }
  };

  const handleFollow = async () => {
    if (!cyberConnect || !searchAddrInfo) {
      return;
    }

    try {
      setFollowLoading(true);

      // Execute connect if the current user is not following the search addrress.
      if (!searchAddrInfo.connections[0].followStatus.isFollowing) {
        await cyberConnect.connect(searchInput);

        // Overwrite the local status of isFollowing
        setSearchAddrInfo((prev) => {
          return !!prev
            ? {
              ...prev,
              connections: [
                {
                  followStatus: {
                    ...prev.connections[0].followStatus,
                    isFollowing: true,
                  },
                },
              ],
            }
            : prev;
        });

        // Add the new following to the current user followings list
        setFollowListInfo((prev) => {
          return !!prev
            ? {
              ...prev,
              followingCount: prev.followingCount + 1,
              followings: {
                ...prev.followings,
                list: removeDuplicate(
                  prev.followings.list.concat([searchAddrInfo.identity])
                ),
              },
            }
            : prev;
        });

        setSnackbarText("Follow Success!");
      } else {
        await cyberConnect.disconnect(searchInput);

        setSearchAddrInfo((prev) => {
          return !!prev
            ? {
              ...prev,
              connections: [
                {
                  followStatus: {
                    ...prev.connections[0].followStatus,
                    isFollowing: false,
                  },
                },
              ],
            }
            : prev;
        });

        setFollowListInfo((prev) => {
          return !!prev
            ? {
              ...prev,
              followingCount: prev.followingCount - 1,
              followings: {
                ...prev.followings,
                list: prev.followings.list.filter((user) => {
                  return user.address !== searchAddrInfo.identity.address;
                }),
              },
            }
            : prev;
        });

        setSnackbarText("Unfollow Success!");
      }

      setSnackbarOpen(true);
    } catch (e) {
      console.error(e);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleInputChange = async (value: string) => {
    setSearchInput(value);

    if (isValidAddr(value) && address && address !== searchInput) {
      setSearchLoading(true);
      await fetchSearchAddrInfo(value);
    }
    setSearchLoading(false);
  };

  // Get the current user followings and followers list
  const initFollowListInfo = async () => {
    if (!address) {
      return;
    }

    const resp = await followListInfoQuery({
      address,
      namespace: NAME_SPACE,
      network: NETWORK,
      followingFirst: FIRST,
      followerFirst: FIRST,
    });
    if (resp) {
      setFollowListInfo(resp);
    }
  };

  const fetchMore = async (type: "followings" | "followers") => {
    if (!address || !followListInfo) {
      return;
    }

    const params =
      type === "followers"
        ? {
          address,
          namespace: NAME_SPACE,
          network: NETWORK,
          followerFirst: FIRST,
          followerAfter: followListInfo.followers.pageInfo.endCursor,
        }
        : {
          address,
          namespace: NAME_SPACE,
          network: NETWORK,
          followingFirst: FIRST,
          followingAfter: followListInfo.followings.pageInfo.endCursor,
        };

    const resp = await followListInfoQuery(params);
    if (resp) {
      type === "followers"
        ? setFollowListInfo({
          ...followListInfo,
          followers: {
            pageInfo: resp.followers.pageInfo,
            list: removeDuplicate(
              followListInfo.followers.list.concat(resp.followers.list)
            ),
          },
        })
        : setFollowListInfo({
          ...followListInfo,
          followings: {
            pageInfo: resp.followings.pageInfo,
            list: removeDuplicate(
              followListInfo.followings.list.concat(resp.followings.list)
            ),
          },
        });
    }
  };

  useEffect(() => {
    initFollowListInfo();
  }, [address]);

  return (




    <div >



      <div className={styles.container}>
        <div className={styles.header}>
          <WalletConnectButton />
        </div>


        <div className={styles.logo}>
          <img
            src="/ethStalker.png"
            alt="ETHstalker Logo"
            width="100%"
            height="100%"
          />
        </div>
        <div className={styles.discription}>


          <h2 >Stalk your friends (crypto wallet)</h2>


        </div>
        <h1 className={styles.title}>ETHstalker</h1>



        <div className={styles.space}>

        </div>



        {followListInfo && (

          <div className={styles.listsContainer}>
            <h1>Who are you stalking?</h1>

            <div className={styles.smallspace}></div>


            {address && (
              <div className={styles.searchSection}>
                <div className={styles.inputContainer}>
                  <TextField
                    onChange={(e) => handleInputChange(e.target.value)}
                    className={styles.textField}
                    placeholder="Please input the Address you want to stalk."
                  />
                  <LoadingButton
                    onClick={handleFollow}
                    disabled={
                      searchLoading ||
                      !isValidAddr(searchInput) ||
                      !address ||
                      address === searchInput
                    }
                    loading={followLoading}
                    className={styles.loadingButton}
                  >
                    {!searchAddrInfo?.connections[0].followStatus.isFollowing
                      ? "Stalk"
                      : "Stop Stalking"}
                  </LoadingButton>
                </div>
                {!isValidAddr(searchInput) ? (
                  <div className={styles.error}>Please enter a valid address.</div>
                ) : address === searchInput ? (
                  <div className={styles.error}>You can’t follow yourself : )</div>
                ) : (
                  <div className={styles.isFollowed}>
                    This user{" "}
                    {searchAddrInfo?.connections[0].followStatus.isFollowed
                      ? "is following you"
                      : "has not followed you yet"}
                  </div>
                )}
              </div>
            )}

            <div className={styles.space}></div>

            <h1 className={styles.negativemargin}>Your List</h1>
            <div className={styles.smallspace}></div>
            <div className={styles.list}>
              <div className={styles.subtitle}>
                You are stalking <strong>{followListInfo.followingCount}</strong>{" "}
                friends:
              </div>
              <div className={styles.followList}>
                {followListInfo.followings.list.map((user) => {
                  return (
                    <div key={user.address} className={styles.user}>
                      <Avatar src={user.avatar} className={styles.avatar} />
                      <div className={styles.userAddress}>
                        {user.domain || user.address}
                      </div>
                    </div>
                  );
                })}
                {followListInfo.followings.pageInfo.hasNextPage && (
                  <LoadingButton onClick={() => fetchMore("followings")}>
                    See More
                  </LoadingButton>
                )}
              </div>
            </div>



          </div>

        )}

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
        >
          <MuiAlert
            onClose={() => setSnackbarOpen(false)}
            severity="success"
            sx={{ width: "100%" }}
          >
            {snackbarText}
          </MuiAlert>
        </Snackbar>


      </div>



    </div>
  );
};

export default Home;
