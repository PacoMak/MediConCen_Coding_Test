-- CreateTable
CREATE TABLE `userIdentities` (
    `id` CHAR(36) NOT NULL,
    `id1` VARCHAR(191) NOT NULL,
    `id2` VARCHAR(191) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `createdBy` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedBy` CHAR(36) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `userIdentities_id1_id2_key`(`id1`, `id2`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
